# Use an official Python runtime as a parent image
FROM python:3.9

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python-dev \
    python3-venv \
    libpq-dev

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Create and activate a virtual environment
RUN python3 -m venv venv
RUN . venv/bin/activate

# Ensure pip is up-to-date
RUN pip install --upgrade pip

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Run the Flask app
CMD ["gunicorn", "-b", "0.0.0.0:80", "app:app"]
