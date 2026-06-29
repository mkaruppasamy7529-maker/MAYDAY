def setup_cors(app, origins: str):
    from fastapi.middleware.cors import CORSMiddleware

    origin_list = ["*"]
    if origins and origins != "*":
        origin_list = [o.strip() for o in origins.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
