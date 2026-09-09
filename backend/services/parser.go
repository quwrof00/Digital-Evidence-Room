package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"log"
	"regexp"
	"strings"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"

	"github.com/google/uuid"
	"github.com/ledongthuc/pdf"
)

// ParseDocument acts as the entrypoint for parsing any supported document type.
func ParseDocument(docID uuid.UUID, filename, ext string, content []byte) {
	// First update the status to "chunking"
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"status":   "chunking",
		"progress": 10,
	})

	var err error
	switch ext {
	case "csv":
		err = parseCSV(docID, filename, content)
	case "txt":
		err = parseWhatsApp(docID, filename, content)
	case "pdf":
		err = parsePDF(docID, filename, content)
	default:
		err = fmt.Errorf("unsupported file type: %s", ext)
	}

	if err != nil {
		log.Printf("Error parsing document %s: %v", docID, err)
		db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
			"status": "error",
		})
		return
	}

	// Mark as completed
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"status":   "completed",
		"progress": 100,
	})
	log.Printf("Finished processing document ID: %s", docID)
}

func parseCSV(docID uuid.UUID, filename string, content []byte) error {
	reader := csv.NewReader(bytes.NewReader(content))
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	var chunks []models.DocumentChunk

	if len(records) < 2 {
		return nil // Not enough rows to have headers and data
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
			ChunkIndex:       i - 1, // 0-indexed relative to data rows
			SourceFile:       filename,
			FileType:         "CSV",
			PageOrLineNumber: &lineNum,
			DetectedDate:     datePtr,
			Content:          text,
		})
	}

	if len(chunks) > 0 {
		return db.DB.Create(&chunks).Error
	}
	return nil
}

func parseWhatsApp(docID uuid.UUID, filename string, content []byte) error {
	lines := strings.Split(string(content), "\n")
	var chunks []models.DocumentChunk
	
	// Format: [17:52, 08/09/2026] Shourya Agrawal: onsa
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

	if len(chunks) > 0 {
		return db.DB.Create(&chunks).Error
	}
	return nil
}

func parsePDF(docID uuid.UUID, filename string, content []byte) error {
	reader := bytes.NewReader(content)
	pdfReader, err := pdf.NewReader(reader, reader.Size())
	if err != nil {
		return err
	}

	numPages := pdfReader.NumPage()
	var chunks []models.DocumentChunk
	chunkIdx := 0

	// Hybrid Strategy: Read page by page. If a page is > 1500 chars, chunk it further.
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
			// Rolling token/character window for large pages
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

	if len(chunks) > 0 {
		return db.DB.CreateInBatches(chunks, 100).Error
	}
	return nil
}
