package services

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"sync"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"

	"github.com/google/uuid"
	"github.com/ledongthuc/pdf"
)

var parseMu sync.Mutex

// ParseDocument acts as the entrypoint for parsing any supported document type.
func ParseDocument(docID uuid.UUID, caseID uuid.UUID, filename, ext string, content []byte) {
	parseMu.Lock()
	defer parseMu.Unlock()

	// First update the status to "chunking"
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"status":   "chunking",
		"progress": 10,
	})
	broadcastStatus(docID, "chunking", 10)

	var err error
	var chunks []models.DocumentChunk

	switch ext {
	case "csv":
		chunks, err = parseCSV(docID, filename, content)
	case "txt":
		chunks, err = parseWhatsApp(docID, filename, content)
	case "pdf":
		chunks, err = parsePDF(docID, filename, content)
	default:
		err = fmt.Errorf("unsupported file type: %s", ext)
	}

	if err != nil {
		log.Printf("Error parsing document %s: %v", docID, err)
		db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
			"status": "error",
		})
		broadcastStatus(docID, "error", 0)
		return
	}

	broadcastStatus(docID, "Running Strands Agents (Timeline, Entity, Claims)...", 50)

	payload := make([]ingestChunk, 0, len(chunks))
	for _, chunk := range chunks {
		item := ingestChunk{
			ChunkIndex: chunk.ChunkIndex,
			SourceFile: chunk.SourceFile,
			FileType:   chunk.FileType,
			Content:    chunk.Content,
			DocumentID: docID.String(),
			CaseID:     caseID.String(),
		}
		if chunk.DetectedDate != nil {
			item.DetectedDate = *chunk.DetectedDate
		}
		payload = append(payload, item)
	}

	extracted, err := IngestAndExtract(caseID, payload)
	if err != nil {
		log.Printf("Strands agents unavailable for %s: %v (saving parser-only chunks)", docID, err)
	} else {
		entityJSON := string((&EntitySchema{Entities: extracted.Entities}).ToJSON())
		claimJSON := string((&ClaimSchema{Claims: extracted.Claims}).ToJSON())
		for i := range chunks {
			chunks[i].Entities = entityJSON
			chunks[i].Claims = claimJSON
		}
		for _, event := range extracted.Events {
			idx := event.ChunkIndex
			if idx >= 0 && idx < len(chunks) {
				date := event.Timestamp
				if date != "" && chunks[idx].DetectedDate == nil {
					chunks[idx].DetectedDate = &date
				}
				if event.IsContradiction {
					chunks[idx].IsContradiction = true
				}
			} else if event.Timestamp != "" && len(chunks) > 0 && chunks[0].DetectedDate == nil {
				date := event.Timestamp
				chunks[0].DetectedDate = &date
				if event.IsContradiction {
					chunks[0].IsContradiction = true
				}
			}
		}
	}

	// Save all chunks to the database
	if len(chunks) > 0 {
		for i := range chunks {
			if chunks[i].Entities == "" {
				chunks[i].Entities = "{}"
			}
			if chunks[i].Claims == "" {
				chunks[i].Claims = "{}"
			}
		}
		db.DB.CreateInBatches(chunks, 100)
	}

	// Mark as completed
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"status":   "completed",
		"progress": 100,
	})
	broadcastStatus(docID, "completed", 100)
	log.Printf("Finished processing document ID: %s", docID)
}

func broadcastStatus(docID uuid.UUID, status string, progress int) {
	msg := map[string]interface{}{
		"type":     "status_update",
		"doc_id":   docID,
		"status":   status,
		"progress": progress,
	}
	b, _ := json.Marshal(msg)
	select {
	case WsHub.Broadcast <- b:
	default:
	}
}

func parseCSV(docID uuid.UUID, filename string, content []byte) ([]models.DocumentChunk, error) {
	reader := csv.NewReader(bytes.NewReader(content))
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	var chunks []models.DocumentChunk

	if len(records) < 2 {
		return chunks, nil 
	}

	headers := records[0]
	dateColIdx := -1
	for i, header := range headers {
		if strings.Contains(strings.ToLower(header), "date") {
			dateColIdx = i
			break
		}
	}

	for i := 1; i < len(records); i++ {
		record := records[i]
		
		lineNum := i + 1
		var textParts []string
		var datePtr *string
		
		if dateColIdx != -1 && dateColIdx < len(record) {
			val := strings.TrimSpace(record[dateColIdx])
			if val != "" {
				datePtr = &val
			}
		}

		for j, val := range record {
			headerName := ""
			if j < len(headers) {
				headerName = strings.TrimSpace(headers[j])
			} else {
				headerName = fmt.Sprintf("Column%d", j+1)
			}
			textParts = append(textParts, fmt.Sprintf("%s: %s", headerName, strings.TrimSpace(val)))
		}

		text := strings.Join(textParts, " | ")
		
		chunks = append(chunks, models.DocumentChunk{
			DocumentID:       docID,
			ChunkIndex:       i - 1, 
			SourceFile:       filename,
			FileType:         "CSV",
			PageOrLineNumber: &lineNum,
			DetectedDate:     datePtr,
			Content:          text,
		})
	}

	return chunks, nil
}

func parseWhatsApp(docID uuid.UUID, filename string, content []byte) ([]models.DocumentChunk, error) {
	lines := strings.Split(string(content), "\n")
	var chunks []models.DocumentChunk
	
	re := regexp.MustCompile(`^\[(.*?)\]\s+(.*?):\s+(.*)$`)

	chunkIdx := 0
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		lineNum := i + 1
		matches := re.FindStringSubmatch(line)
		
		var dateStr *string
		var cleanText string
		if len(matches) == 4 {
			d := matches[1]
			dateStr = &d
			sender := matches[2]
			msg := matches[3]
			cleanText = fmt.Sprintf("[%s] %s: %s", d, sender, msg)
		} else {
			cleanText = line
		}

		chunks = append(chunks, models.DocumentChunk{
			DocumentID:       docID,
			ChunkIndex:       chunkIdx,
			SourceFile:       filename,
			FileType:         "TXT",
			PageOrLineNumber: &lineNum,
			DetectedDate:     dateStr,
			Content:          cleanText,
		})
		chunkIdx++
	}

	return chunks, nil
}

func parsePDF(docID uuid.UUID, filename string, content []byte) ([]models.DocumentChunk, error) {
	reader := bytes.NewReader(content)
	pdfReader, err := pdf.NewReader(reader, reader.Size())
	if err != nil {
		return nil, err
	}

	numPages := pdfReader.NumPage()
	var chunks []models.DocumentChunk
	chunkIdx := 0

	const maxChars = 1500
	const overlap = 150

	for i := 1; i <= numPages; i++ {
		page := pdfReader.Page(i)
		if page.V.IsNull() {
			continue
		}
		
		text, err := page.GetPlainText(nil)
		if err != nil {
			continue
		}
		
		text = strings.TrimSpace(text)
		if text == "" {
			continue
		}

		pageNum := i

		if len(text) <= maxChars {
			chunks = append(chunks, models.DocumentChunk{
				DocumentID:       docID,
				ChunkIndex:       chunkIdx,
				SourceFile:       filename,
				FileType:         "PDF",
				PageOrLineNumber: &pageNum,
				Content:          text,
			})
			chunkIdx++
		} else {
			runes := []rune(text)
			start := 0
			for start < len(runes) {
				end := start + maxChars
				if end > len(runes) {
					end = len(runes)
				}
				
				chunkText := string(runes[start:end])
				chunks = append(chunks, models.DocumentChunk{
					DocumentID:       docID,
					ChunkIndex:       chunkIdx,
					SourceFile:       filename,
					FileType:         "PDF",
					PageOrLineNumber: &pageNum,
					Content:          chunkText,
				})
				chunkIdx++
				
				if end == len(runes) {
					break
				}
				start = end - overlap
			}
		}
	}

	return chunks, nil
}
