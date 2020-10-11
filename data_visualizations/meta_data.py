import csv
import os
import json
from datetime import datetime

stock_article_dirs = {
    "1": r'C:\Users\sidds\Documents\Fall 2020 Courses\CSCE 470\WolvesofWallStreet\data\1',
    "2": r'C:\Users\sidds\Documents\Fall 2020 Courses\CSCE 470\WolvesofWallStreet\data\2',
    "3": r'C:\Users\sidds\Documents\Fall 2020 Courses\CSCE 470\WolvesofWallStreet\data\3'
}

for key, value in stock_article_dirs.items():
    for filename in os.listdir(value):
        with open(os.path.join(value, filename)) as file:
            stock_article_data = json.load(file)
            with open('data_visualizations/stock_article_data.csv', mode="a", encoding="utf-8", newline='') as stock_article_file:
                stock_article_writer = csv.writer(stock_article_file, delimiter=",",quotechar='"',quoting=csv.QUOTE_MINIMAL)
                url = stock_article_data["article"][0]["url"]
                published = int(float(stock_article_data["article"][0]["published"]))
                published_date_time_iso = str(datetime.fromtimestamp(published))
                published_date = published_date_time_iso[0:published_date_time_iso.find(" ")]
                headline = stock_article_data["article"][0]["headline"]
                body = stock_article_data["article"][0]["body"]
                stock_article_writer.writerow([url, published_date,headline,body])