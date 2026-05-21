from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import alerts, audit, auth, cases, transactions
from app.routers import prediction, workflow   # NEW — predictive engine + workflow


def create_app() -> FastAPI:
    app = FastAPI(
        title="XEPA AML Detection System",
        version="2.0.0",
        description="Predictive AML platform: pattern memory, ghost-node forecasting, multi-role workflow.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": "2.0.0"}

    # Existing routers
    app.include_router(auth.router,         prefix="/api")
    app.include_router(cases.router,        prefix="/api")
    app.include_router(transactions.router, prefix="/api")
    app.include_router(alerts.router,       prefix="/api")
    app.include_router(audit.router,        prefix="/api")

    # New routers — predictive engine + workflow
    app.include_router(prediction.router,   prefix="/api")
    app.include_router(workflow.router,     prefix="/api")

    return app


app = create_app()
