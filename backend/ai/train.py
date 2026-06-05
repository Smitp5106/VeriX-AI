import os
import zipfile
import shutil
import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.metrics import accuracy_score, classification_report

# Paths
downloads_dir = r"C:\Users\HP\Desktop\VeriX-AI"
fake_zip = os.path.join(downloads_dir, "dataset", "Fake.csv.zip")
true_zip = os.path.join(downloads_dir, "True.csv.zip")

ai_dir = os.path.dirname(os.path.abspath(__file__))
temp_dir = os.path.join(ai_dir, "temp_extract")

def prepare_data():
    print("Preparing and unzipping datasets...")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Unzip Fake
    print(f"Unzipping {fake_zip}...")
    with zipfile.ZipFile(fake_zip, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
        
    # Unzip True
    print(f"Unzipping {true_zip}...")
    with zipfile.ZipFile(true_zip, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
        
    print("Data extraction complete.")

def train_model():
    fake_path = os.path.join(temp_dir, "Fake.csv")
    true_path = os.path.join(temp_dir, "True.csv")
    
    if not os.path.exists(fake_path) or not os.path.exists(true_path):
        print("Error: Could not find extracted CSV files.")
        return
        
    print("Loading datasets into pandas...")
    df_fake = pd.read_csv(fake_path)
    df_true = pd.read_csv(true_path)
    
    # Assign labels (1 for Fake, 0 for True)
    df_fake['label'] = 1
    df_true['label'] = 0
    
    # Merge datasets
    print(f"Fake news articles: {len(df_fake)}")
    print(f"True news articles: {len(df_true)}")
    df = pd.concat([df_fake, df_true], ignore_index=True)
    
    # Preprocessing
    print("Preprocessing text data...")
    # Fill NaN values
    df = df.fillna('')
    # Merge Title and Text for better context representation
    df['total_text'] = df['title'] + " " + df['text']
    
    # Split into features and targets
    X = df['total_text']
    y = df['label']
    
    # Split into train/test
    print("Splitting into train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize TF-IDF Vectorizer (compact max_features to ensure fast load time during inference)
    print("Initializing TF-IDF Vectorizer...")
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000, lowercase=True)
    
    # Fit and transform train data, transform test data
    print("Fitting vectorizer...")
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    
    # Initialize PassiveAggressiveClassifier
    print("Training PassiveAggressiveClassifier...")
    classifier = PassiveAggressiveClassifier(max_iter=50, random_state=42)
    classifier.fit(X_train_tfidf, y_train)
    
    # Evaluate model
    print("Evaluating model performance...")
    y_pred = classifier.predict(X_test_tfidf)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['True News', 'Fake News']))
    
    # Save the model and vectorizer
    model_path = os.path.join(ai_dir, "model.pkl")
    vectorizer_path = os.path.join(ai_dir, "vectorizer.pkl")
    
    print(f"Saving model to {model_path}...")
    with open(model_path, 'wb') as f:
        pickle.dump(classifier, f)
        
    print(f"Saving vectorizer to {vectorizer_path}...")
    with open(vectorizer_path, 'wb') as f:
        pickle.dump(vectorizer, f)
        
    print("Model assets saved successfully.")
    
    # Clean up temp folder
    print("Cleaning up temporary directory...")
    try:
        shutil.rmtree(temp_dir)
        print("Cleanup completed.")
    except Exception as e:
        print(f"Error cleaning up temp directory: {e}")

if __name__ == "__main__":
    prepare_data()
    train_model()
