import requests
from bs4 import BeautifulSoup
import json
import os

def scrape_news(url, headline_tag):
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the HTML content of the page
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all headline elements
            headline_elements = soup.find_all(headline_tag)
            
            # Extract the details of each headline
            article_details = []
            for element in headline_elements:
                headline = element.get_text(strip=True)
                if headline:
                    article_details.append({'headline': headline})
            
            # Return the list of article details
            return article_details
        else:
            # If the request was not successful, print an error message
            print(f"Error: Unable to retrieve news articles from {url}...status_code {response.status_code}")
            return None
    except Exception as e:
        # Print any exceptions that occur during the scraping process
        print(f"Error occurred during scraping {url}: {e}")
        return None

# Function to call LLM API to determine the locations for a batch of headlines
def get_locations_from_llm(headlines, api_url, api_key):
    # Prepare the input prompt with all headlines
    prompt = "Identify the country (not region) to which each of the news headlines belong to in the following news headlines:\n"
    for i, headline in enumerate(headlines):
        prompt += f"{i+1}. {headline}\n"

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt}
    ]
    
    payload = json.dumps({
        "model": "Awanllm-Llama-3-8B-Dolfin",
        "messages": messages
    })
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {api_key}"
    }
    
    try:
        response = requests.post(api_url, headers=headers, data=payload)
        response.raise_for_status()
        response_data = response.json()
        
        # Extract the assistant's reply and parse it
        assistant_message = response_data['choices'][0]['message']['content']
        locations = assistant_message.strip().split('\n')
        
        # Map the locations back to headlines
        headline_locations = {}
        for loc in locations:
            if ". " in loc:
                idx, location = loc.split(". ", 1)
                try:
                    headline_locations[int(idx)-1] = location.strip()
                except ValueError:
                    continue
        
        return headline_locations
        
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        return None
    except Exception as err:
        print(f"Other error occurred: {err}")
        return None

# Function to export the data to a JSON file
def export_data(news_articles, output_file):
    try:
        with open(output_file, 'w') as f:
            json.dump(news_articles, f, indent=4)
        print(f"Data exported to {output_file}")
    except Exception as e:
        print("Error occurred while exporting data:", e)

# URLs of news websites and their corresponding headline tags
news_sites = [
    {"url": "https://www.bbc.com/news/world", "tag": "h2"},
    {"url": "https://www.washingtonpost.com/world/", "tag": "h3"}
]

all_news_articles = []

# Scrape news articles from each website
for site in news_sites:
    articles = scrape_news(site["url"], site["tag"])
    if articles:
        all_news_articles.extend(articles)

# Collect all headlines for batch processing
headlines = [article['headline'] for article in all_news_articles]

# LLM API configuration
api_url = "https://api.awanllm.com/v1/chat/completions"
if __name__ == "__main__":
    api_key = os.getenv('API_KEY')
    if not api_key:
        raise ValueError("API_KEY environment variable not set")

    # Get locations for all headlines in a single request using LLM
    headline_locations = get_locations_from_llm(headlines, api_url, api_key)

    # Add locations to the articles
    if headline_locations:
        for i, article in enumerate(all_news_articles):
            article['location'] = headline_locations.get(i, "Location not found")


    # Export the data to a JSON file
    export_data(all_news_articles, 'news_data_with_locations.json')