package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
)

type TimelineEvent struct {
	Timestamp       string `json:"timestamp"`
	Description     string `json:"description"`
	IsContradiction bool   `json:"is_contradiction"`
	ChunkIndex      int    `json:"chunk_index"`
	SourceFile      string `json:"source_file"`
}

type Entity struct {
	Type       string `json:"type"`
	Name       string `json:"name"`
	SourceFile string `json:"source_file"`
}

type Claim struct {
	Assertion     string `json:"assertion"`
	Confidence    string `json:"confidence"`
	SourceFile    string `json:"source_file"`
	ConflictsWith string `json:"conflicts_with"`
}

type TimelineSchema struct {
	Events []TimelineEvent `json:"events"`
}

type EntitySchema struct {
	Entities []Entity `json:"entities"`
}

type ClaimSchema struct {
	Claims []Claim `json:"claims"`
}

type ExtractedStrands struct {
	Timeline TimelineSchema
	Entities EntitySchema
	Claims   ClaimSchema
}

type ingestChunk struct {
	ChunkIndex    int    `json:"chunk_index"`
	SourceFile    string `json:"source_file"`
	FileType      string `json:"file_type"`
	Content       string `json:"content"`
	DetectedDate  string `json:"detected_date,omitempty"`
	DocumentID    string `json:"document_id"`
}

type ingestRequest struct {
	DocumentID string        `json:"document_id"`
	Chunks     []ingestChunk `json:"chunks"`
}

type extractResponse struct {
	Events   []TimelineEvent `json:"events"`
	Entities []Entity        `json:"entities"`
	Claims   []Claim         `json:"claims"`
}

func strandsBaseURL() string {
	if v := os.Getenv("STRANDS_URL"); v != "" {
		return v
	}
	return "http://127.0.0.1:8000"
}

func httpClient() *http.Client {
	return &http.Client{Timeout: 180 * time.Second}
}

func IngestAndExtract(docID uuid.UUID, chunks []ingestChunk) (*extractResponse, error) {
	base := strandsBaseURL()
	body, _ := json.Marshal(ingestRequest{DocumentID: docID.String(), Chunks: chunks})
	resp, err := httpClient().Post(base+"/ingest", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("strands ingest: %w", err)
	}
	io.Copy(io.Discard, resp.Body)
	resp.Body.Close()
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("strands ingest HTTP %d", resp.StatusCode)
	}

	resp, err = httpClient().Post(base+"/extract", "application/json", bytes.NewReader([]byte("{}")))
	if err != nil {
		return nil, fmt.Errorf("strands extract: %w", err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("strands extract HTTP %d: %s", resp.StatusCode, string(raw))
	}
	var out extractResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("strands extract json: %w", err)
	}
	log.Printf("Strands extract for %s: %d events, %d entities, %d claims", docID, len(out.Events), len(out.Entities), len(out.Claims))
	return &out, nil
}

func ApplyExtraction(chunksLen int, extracted *extractResponse) ExtractedStrands {
	var result ExtractedStrands
	if extracted == nil {
		return result
	}
	result.Timeline.Events = extracted.Events
	result.Entities.Entities = extracted.Entities
	result.Claims.Claims = extracted.Claims
	_ = chunksLen
	return result
}

func (es *EntitySchema) ToJSON() []byte {
	b, _ := json.Marshal(es)
	return b
}

func (cs *ClaimSchema) ToJSON() []byte {
	b, _ := json.Marshal(cs)
	return b
}
