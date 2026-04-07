from fastapi import FastAPI

app =  FastAPI(title="FastAPI Backend", description="A simple FastAPI backend for demonstration purposes.", version="1.0.0")

@app.get("/")
def root():
    return {"message": "Bienvenido a FarmaSmart API!"}

print("Hola bebe")