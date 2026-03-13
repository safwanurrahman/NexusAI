# NexusAI: LinkedIn Researcher 🚀

NexusAI is a powerful, automated research agent designed to perform deep-dive analysis on LinkedIn profiles. By combining modern web scraping with Large Language Models (LLMs), it generates high-quality professional summaries and insights in seconds.

## 🏗️ The Architecture

The project is built using a **distributed microservices architecture** to ensure the user interface remains responsive while heavy background tasks (AI processing) are handled asynchronously.



### Tech Stack
* **Frontend**: React (Vite) + Tailwind CSS (hosted on `localhost:8080`)
* **Backend API**: FastAPI (Python 3.12)
* **Task Queue**: Celery (Distributed task execution)
* **Message Broker**: Redis (High-speed in-memory data store)
* **Containerization**: Docker & Docker Compose
* **AI/Scraping**: OpenAI GPT-4 & Proxycurl API

---

## ⚡ Quick Start

### 1. Prerequisites
Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

### 2. Environment Setup
Create a `.env` file in the `backend/` directory and add your API keys:

```env
# External APIs
PROXYCURL_API_KEY=your_proxycurl_key
OPENAI_API_KEY=your_openai_key

# Docker Internal Networking
REDIS_URL=redis://redis:6379/0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:8080"]
