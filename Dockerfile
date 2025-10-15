# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the working directory
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install system dependencies including SWIG
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    python3-venv \
    libpq-dev \
    libp11-kit-dev \
    swig

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Add a change to ensure detection
RUN echo "This is a forced change" > /tmp/force-change.txt

# Command to run the application
CMD ["python", "app.py"]
