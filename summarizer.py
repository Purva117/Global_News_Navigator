import json
import requests
import time
import pycountry
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

def load_sorted_data(input_file):
    try:
        with open(input_file, 'r') as f:
            news_articles = json.load(f)
        return news_articles
    except Exception as e:
        print(f"Error occurred while loading data from {input_file}: {e}")
        return []

def is_valid_country(location):
    try:
        if pycountry.countries.lookup(location):
            return True
    except LookupError:
        return False
    return False

def get_country_coordinates(country_name):
    try:
        if country_name == "Greece":
            return (39.0742, 21.8243)
        else:
            geolocator = Nominatim(user_agent="news_locator")
            location = geolocator.geocode(country_name, timeout=10)
            if location:
                return (location.latitude, location.longitude)
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"Geocoding error: {e}")
    return None

def group_headlines_by_location(news_articles):
    grouped_headlines = {}
    for article in news_articles:
        location = article['location']
        if location not in grouped_headlines:
            grouped_headlines[location] = []
        grouped_headlines[location].append(article['headline'])
    return grouped_headlines

def create_prompt_for_location(location, headlines):
    prompt = f"Summarize the following news headlines into a maximum of 3 key points (no more than 3 key points, and please do not write anything else than the bullet point summary) for {location}:\n"
    for headline in headlines:
        prompt += f"- {headline}\n"
    prompt += "\nSummaries:"
    return prompt

def get_summary_from_llm(prompt, api_key):
    url = "https://api.awanllm.com/v1/chat/completions"
    payload = json.dumps({
        "model": "Awanllm-Llama-3-8B-Dolfin",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    })
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {api_key}"
    }

    response = requests.post(url, headers=headers, data=payload)
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content'].strip()

def summarize_headlines(grouped_headlines, api_key):
    summarized_data = []

    for location, headlines in grouped_headlines.items():
        prompt = create_prompt_for_location(location, headlines)
        try:
            summary = get_summary_from_llm(prompt, api_key)
            summarized_data.append({"location": location, "summary": summary})
            # Print for debugging purposes
            print(f"Summarized {location}: {summary}")
        except Exception as e:
            print(f"Error occurred while summarizing headlines for {location}: {e}")
        # Respect API rate limits
        time.sleep(10)  # Sleep for 10 seconds to stay within 10 requests per minute

    return summarized_data

def save_summarized_data(summarized_data, output_file):
    try:
        with open(output_file, 'w') as f:
            json.dump(summarized_data, f, indent=4)
        print(f"Summarized data exported to {output_file}")
    except Exception as e:
        print(f"Error occurred while exporting summarized data: {e}")

# Input and output file paths
input_file = 'sorted_news_data.json'
output_file = 'summarized_news_data.json'
api_key = '008c3ec5-1822-450a-8755-bb3ff2eb5443'  # Replace with your actual API key

# Load sorted data
news_articles = load_sorted_data(input_file)

# Group headlines by location
grouped_headlines = group_headlines_by_location(news_articles)

# Generate summaries for each location
summarized_data = summarize_headlines(grouped_headlines, api_key)

# Convert country names to coordinates and save the summarized data
for article in summarized_data:
    location = article['location']
    if is_valid_country(location):
        coordinates = get_country_coordinates(location)
        if coordinates:
            article['coordinates'] = coordinates
        else:
            print(f"Failed to get coordinates for {location}")
    else:
        print(f"{location} is not a valid country name")

# Save the summarized data to a new JSON file
save_summarized_data(summarized_data, output_file)
