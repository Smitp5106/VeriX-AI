import os
import pickle
import json
import numpy as np

ai_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(ai_dir, "model.pkl")
vectorizer_path = os.path.join(ai_dir, "vectorizer.pkl")
export_path = os.path.join(ai_dir, "model_data.json")

print("Loading model and vectorizer...")
with open(model_path, 'rb') as f:
    classifier = pickle.load(f)
with open(vectorizer_path, 'rb') as f:
    vectorizer = pickle.load(f)

# Extract vocabulary (map of word -> index)
vocabulary = vectorizer.vocabulary_
# Convert vocabulary index values to standard Python integers
vocabulary = {word: int(idx) for word, idx in vocabulary.items()}

# Extract IDF values
idf = vectorizer.idf_.tolist()

# Extract coefficients and intercept
coef = classifier.coef_[0].tolist()
intercept = float(classifier.intercept_[0])

model_data = {
    "vocabulary": vocabulary,
    "idf": idf,
    "coef": coef,
    "intercept": intercept
}

print(f"Exporting model parameters to {export_path}...")
with open(export_path, 'w') as f:
    json.dump(model_data, f)

print("Export complete.")
