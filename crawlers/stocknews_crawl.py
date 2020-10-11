from lxml import html
from dateutil.parser import parse
import datetime
import requests
import json

visitedSites = set()
toBeProcessed = []

visitedSites.add("https://stocknews.com/top-stories/")
for x in range(2, 50):
    visitedSites.add("https://stocknews.com/top-stories/?pg=" + str(x))
toBeProcessed.append("https://stocknews.com/top-stories/")
for x in range(2, 50):
    toBeProcessed.append("https://stocknews.com/top-stories/?pg=" + str(x))
#toBeProcessed.append("https://stocknews.com/news/sgen-fate-bpmc-the-3-top-biotech-stocks-that-hedge-fund-managers-love/")
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

    if "/news/" in url:
        print("     scraping", url)
        #get the headline
        headline = tree.xpath('//h1[starts-with(@class, "page-title")]/text()')
        if not headline:
            print("Skipping due to bad headline")
            continue    #headline not valid, so skip
        else:
            headline = headline[0].strip()
        #get the published date
        published = tree.cssselect('section.post-meta > a')[0].text_content()
        if published:
            published += " 12:00pm ET"
            published = parse(published, tzinfos=tzinfos)
        else:
            print("skipping due to bad date")
            continue    #date not valid, so skip
        if published < cutoffDate:
            print("skipping due to old date")
            continue
        #get the body
        try:
            body = " ".join(tree.get_element_by_id('articlecontent').text_content().split())
            body = body.split("var lazy_load",1)[0]
        except:
            print("skipping due to bad body")
            continue    #body not valid, so skip

        jsonData['article'].append({
            'url': url,
            'published': published.timestamp(),
            'headline': headline,
            'body': body
        })

        with open('stocknews-data' + str(dataWritten) + '.json', 'w') as outfile:
            json.dump(jsonData, outfile)

        dataWritten += 1
            
        print('Headline: ', headline)
        print('Published: ', published)
        #print('Body: ', body[0:550])
        
    #print('Links: ', urls[0:20])
    for link in urls:
        if link.startswith("/news/"):
            link = "https://stocknews.com" + link
        if "https://stocknews.com/news/" in link:
            link = link.split("?", 1)[0]
            if not link in visitedSites:
                visitedSites.add(link)
                toBeProcessed.append(link)

    documentsProcessed += 1
    print("Documents processed:", documentsProcessed, "remaining:", len(toBeProcessed))

    
print("links: ", len(visitedSites))
