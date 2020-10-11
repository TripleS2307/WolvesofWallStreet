from lxml import html
from dateutil.parser import parse
import datetime
import requests
import json

visitedSites = set()
toBeProcessed = []

visitedSites.add("https://finance.yahoo.com")
toBeProcessed.append("https://finance.yahoo.com")
documentsProcessed = 0
dataWritten = 0

tzinfos = {"ET": -500}
cutoffDate = parse('Jun. 10, 2020 at 2:05 p.m. ET', tzinfos=tzinfos)

while toBeProcessed and dataWritten < 10000:

    url = toBeProcessed.pop(0)
    print("     processing", url)
    try:
        page = requests.get(url)
        tree = html.fromstring(page.content)
    except:
        print("skipping due to bad html")
        continue    #html not valid, so skip

    jsonData = {}
    jsonData['article'] = []

    #get all links
    urls = tree.xpath('//a/@href')

    if "/news/" in url and not url.endswith("/news/"):
        print("     scraping", url)
        #get the headline
        headline = tree.xpath('//h1[@data-test-locator="headline"]/text()')
        if not headline:
            print("Skipping due to bad headline")
            continue    #headline not valid, so skip
        headline = headline[0].strip()
        #get the published date
        published = tree.xpath('//time/text()')
        if published:
            published = parse(published[0] + " ET", tzinfos=tzinfos)
        else:
            print("skipping due to bad date")
            continue    #date not valid, so skip
        if published < cutoffDate:
            print("skipping due to old date")
            continue
        #get the body
        try:
            body = " ".join(tree.xpath('//div[@class="caas-body"]')[0].text_content().split())
        except:
            print("skipping due to bad body")
            continue    #body not valid, so skip

        jsonData['article'].append({
            'url': url,
            'published': published.timestamp(),
            'headline': headline,
            'body': body
        })

        with open('yahoo-data' + str(dataWritten) + '.json', 'w') as outfile:
            json.dump(jsonData, outfile)

        dataWritten += 1
            
        print('Headline: ', headline)
        print('Published: ', published)
        #print('Body: ', body[0:550])
        
    #print('Links: ', urls[0:20])
    for link in urls:
        if link.startswith("/news/"):
            link = "https://finance.yahoo.com" + link
        if "https://finance.yahoo.com/news/" in link:
            link = link.split("?", 1)[0]
            if not link in visitedSites:
                visitedSites.add(link)
                toBeProcessed.append(link)

    documentsProcessed += 1
    print("Documents processed:", documentsProcessed, "remaining:", len(toBeProcessed))

    
print("links: ", len(visitedSites))
