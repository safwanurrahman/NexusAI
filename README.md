# NexusAI: Intelligent LinkedIn Research Assistant

NexusAI is a full-stack research tool that automates the extraction of professional insights from LinkedIn. It leverages **FastAPI**, **React**, and **OpenAI** to transform raw profile data into actionable summaries.

## Key Features
* **Dual-Mode Deployment**: Engineered with a "Manual Toggle" system allowing seamless switching between local development and cloud production (Railway/Netlify).
* **Asynchronous Processing**: Implemented a non-blocking architecture using **Celery** and **Redis** (with a local **threading** fallback) to handle high-latency scraping tasks.
* **Intelligent Summarization**: Integrated **OpenAI GPT-3.5/4** to generate concise 2-sentence insights from raw LinkedIn professional summaries.
* **Real-time Polling**: Developed a custom React hook for efficient status polling, ensuring a smooth UX while background tasks process.

## Technical Stack
- **Backend**: Python, FastAPI, Pydantic (v2), Celery, Uvicorn
- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Data Sourcing**: Proxycurl LinkedIn API
- **Infrastructure**: Redis, Git, Railway (API), Netlify (UI)

## Architecture
The system uses a "Waiter-Chef" model:
1. **The Waiter (FastAPI)**: Receives the research request and validates data via Pydantic.
2. **The Conveyor (Redis)**: Hands off the task to the background queue.
3. **The Chef (Celery Worker)**: Scrapes LinkedIn via Proxycurl and processes data through the OpenAI Brain.
