import json
import pycountry
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

def load_data(input_file):
    try:
        with open(input_file, 'r') as f:
            news_articles = json.load(f)
        return news_articles
    except Exception as e:
        print(f"Error occurred while loading data from {input_file}: {e}")
        return []

def clean_location(location):
    # Omit headlines with "None" location
    if location.lower() == "none":
        return None
    # If the location contains "/", take the first country
    if "/" in location:
        location = location.split("/")[0].strip()
    return location

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
            return(39.0742, 21.8243)
        else:
            geolocator = Nominatim(user_agent="news_locator")
            location = geolocator.geocode(country_name, timeout=10)
            if location:
                return (location.latitude, location.longitude)
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"Geocoding error: {e}")
    return None

def sort_articles_by_location(news_articles):
    # Clean locations and filter out articles with no valid location
    cleaned_articles = []
    for article in news_articles:
        location = clean_location(article['location'])
        if location and is_valid_country(location):
            article['location'] = location
            coordinates = get_country_coordinates(location)
            if coordinates:
                article['coordinates'] = coordinates
                cleaned_articles.append(article)
    
    # Sort articles by location
    sorted_articles = sorted(cleaned_articles, key=lambda x: x['location'])
    return sorted_articles

def export_sorted_data(sorted_articles, output_file):
    try:
        with open(output_file, 'w') as f:
            json.dump(sorted_articles, f, indent=4)
        print(f"Sorted data exported to {output_file}")
    except Exception as e:
        print(f"Error occurred while exporting sorted data: {e}")

# Input and output file paths
input_file = 'news_data_with_locations.json'
output_file = 'sorted_news_data.json'

# Load data from the JSON file
news_articles = load_data(input_file)

# Sort articles by location
sorted_articles = sort_articles_by_location(news_articles)

# Export the sorted data to a new JSON file
export_sorted_data(sorted_articles, output_file)