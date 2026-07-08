# VeriX AI - Smart Fake News Misinformation Detection System

## Overview

VeriX AI is an AI-powered web application that detects fake news and social media misinformation using Machine Learning (ML), Natural Language Processing (NLP), Optical Character Recognition (OCR), and trusted news verification sources.

The platform allows users to analyze news articles, headlines, social media posts, or images containing text. It predicts whether the content is **Likely Real**, **Likely Fake**, or **Uncertain**, while providing a confidence score, sentiment analysis, trust score, and supporting news references.

---

# Features

- Google Authentication
- Fake News Detection
- Social Media Post Analysis
- OCR-based Image to Text Detection
- NLP Text Processing
- Machine Learning Classification
- Real-time News Verification
- Sentiment Analysis
- Trust Score Calculation
- Prediction History
- Analytics Dashboard
- Responsive Modern UI

---

# Tech Stack

## Frontend

- Next.js 15+
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Axios
- Chart.js
- Tesseract.js

## Backend

- Node.js
- Express.js
- JWT Authentication
- Google OAuth
- REST API

## AI / ML

- Python
- Scikit-learn
- NLTK
- Pandas
- NumPy
- TF-IDF Vectorizer
- PassiveAggressiveClassifier

## Database

- MongoDB
- Mongoose

---

# Project Structure

```
VeriX-AI/

├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── styles/
│
├── backend/
│   ├── ai/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── uploads/
│   └── index.js
│
├── dataset/
│   ├── Fake.csv
│   ├── True.csv
│   ├── FakeNewsNet
│   └── Liar Dataset
│
├── docs/
├── README.md
└── vercel.json
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/VeriX-AI.git

cd VeriX-AI
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Backend

```bash
cd backend

npm install

npm start
```

---

## ML Model

```bash
cd ml-model

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python train.py
```

---

# How the System Works

1. User signs in using Google Authentication.
2. User submits text or uploads an image.
3. Images are converted into text using OCR.
4. NLP preprocessing cleans the text.
5. TF-IDF converts text into feature vectors.
6. PassiveAggressiveClassifier predicts Real or Fake.
7. News APIs verify similar trusted news.
8. Sentiment analysis calculates emotional tone.
9. Results are stored in MongoDB.
10. Dashboard displays prediction history and analytics.

---

# APIs Used

- Google Authentication API
- Google News RSS
- Bing News RSS
- Google Fact Check API

---

# Dataset Used

- Fake & Real News Dataset (Kaggle)
- FakeNewsNet
- LIAR Dataset

---

# Machine Learning Pipeline

Dataset

↓

Data Cleaning

↓

Text Preprocessing

↓

TF-IDF Vectorization

↓

PassiveAggressiveClassifier

↓

Prediction

↓

Confidence Score

↓

News Verification

↓

Result

---

# Main Functionalities

- Fake News Detection
- News Verification
- Social Media Analysis
- OCR Detection
- Authentication
- Analytics Dashboard
- Prediction History

---

# Future Enhancements

- Deepfake Detection
- Video Verification
- Browser Extension
- WhatsApp Verification
- Telegram Verification
- Multilingual Support
- Live Model Retraining

---

# Contributors

- Patel Smit
- Member 2
- Member 3

---

# License

This project is developed for educational and research purposes.
