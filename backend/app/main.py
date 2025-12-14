from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def root():
    return {'status': 'ok', 'message': 'Penny Options backend live'}
