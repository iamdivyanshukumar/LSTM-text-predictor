from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import pickle
import os

app = Flask(__name__)

# Load model and tokenizer
model = load_model('next_word_model.h5')
with open('tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)
max_len = 20  # Should match your trained model's max_len

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        text = request.json.get('text', '')
        num_predictions = min(int(request.json.get('num_predictions', 3)), 5)
        
        if not text.strip():
            return jsonify({'predictions': []})
        
        seq = tokenizer.texts_to_sequences([text])[0]
        seq = pad_sequences([seq], maxlen=max_len-1, padding="pre")
        pred = model.predict(seq, verbose=0)[0]
        
        top_indices = np.argsort(pred)[-num_predictions:][::-1]
        predictions = []
        
        for idx in top_indices:
            for word, word_idx in tokenizer.word_index.items():
                if word_idx == idx:
                    predictions.append(word)
                    break
        
        return jsonify({'predictions': predictions[:num_predictions]})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)