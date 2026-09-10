package services

import (
	"encoding/json"
	"log"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

// --- JSON Schemas ---

type TimelineEvent struct {
	Timestamp   string `json:"timestamp"`
	Description string `json:"description"`
}

type TimelineSchema struct {
	Events []TimelineEvent `json:"events"`
}

type Entity struct {
	Type string `json:"type"` // e.g., "Person", "Organization", "PhoneNumber"
	Name string `json:"name"`
}

type EntitySchema struct {
	Entities []Entity `json:"entities"`
}

type Claim struct {
	Assertion  string `json:"assertion"`
	Confidence string `json:"confidence"` // e.g., "High", "Medium", "Low"
}

type ClaimSchema struct {
	Claims []Claim `json:"claims"`
}

// ExtractedStrands represents the combined output of all 3 agents
type ExtractedStrands struct {
	Timeline TimelineSchema
	Entities EntitySchema
	Claims   ClaimSchema
}

// --- Agent Logic ---

// RunStrandsAgents mocks the execution of 3 specialized LLM micro-agents on a document chunk.
func RunStrandsAgents(docID uuid.UUID, chunkIndex int, rawContent string) ExtractedStrands {
	// In a real implementation, we would construct 3 distinct prompts and call an LLM API 3 times
	// e.g., prompt1 := "You are a Timeline Agent. Identify timestamps... Content: " + rawContent
	// LLMCall(prompt1, TimelineSchema{})
	
	// Simulate LLM latency (in a real app, these would run concurrently via goroutines)
	time.Sleep(500 * time.Millisecond)

	// --- Mock Output Generation ---
	// We will just generate some dummy structured data for the sake of the mock

	var strands ExtractedStrands

	// 1. Mock Timeline Agent
	// Try to extract a date if it looks like one, or just default.
	strands.Timeline = TimelineSchema{
		Events: []TimelineEvent{
			{Timestamp: "2026-09-01", Description: "Event mentioned in text: " + clipText(rawContent, 30)},
		},
	}

	// 2. Mock Entity Agent
	strands.Entities = EntitySchema{
		Entities: []Entity{
			{Type: "Person", Name: "John Doe"},
			{Type: "Organization", Name: "Acme Corp"},
		},
	}
	// Add some random variation
	if rand.Float32() > 0.5 {
		strands.Entities.Entities = append(strands.Entities.Entities, Entity{Type: "PhoneNumber", Name: "+1-555-0198"})
	}

	// 3. Mock Claims Agent
	strands.Claims = ClaimSchema{
		Claims: []Claim{
			{Assertion: "Claimed that " + clipText(rawContent, 40), Confidence: "High"},
		},
	}

	log.Printf("Strands Agents completed for Doc %s Chunk %d", docID, chunkIndex)
	return strands
}

func clipText(s string, max int) string {
	if len(s) > max {
		return s[:max] + "..."
	}
	return s
}

// Helper to convert structs to JSON bytes for DB storage
func (es *EntitySchema) ToJSON() []byte {
	b, _ := json.Marshal(es)
	return b
}

func (cs *ClaimSchema) ToJSON() []byte {
	b, _ := json.Marshal(cs)
	return b
}
