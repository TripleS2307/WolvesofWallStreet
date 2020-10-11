from lxml import html
from dateutil.parser import parse
import datetime
import requests
import json

visitedSites = set()
toBeProcessed = []

visitedSites.add("https://www.marketwatch.com/search?q=&m=Keyword&rpp=1000&mp=806&bd=false&rs=true")
toBeProcessed.append("https://www.marketwatch.com/search?q=&m=Keyword&rpp=1000&mp=806&bd=false&rs=true")
#toBeProcessed.append("https://www.marketwatch.com/story/dont-miss-out-on-this-generational-opportunity-in-the-stock-market-hedge-fund-manager-says-11602183237?mod=home-page")
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

    if "/story/" in url:
        print("     scraping", url)
        #get the headline
        headline = tree.xpath('//h1[@itemprop="headline"]/text()')
        if not headline:
            print("Skipping due to bad headline")
            continue    #headline not valid, so skip
        else:
            if len(headline) > 1:
                headline = headline[1].strip()
            else:
                headline = headline[0].strip()
        #get the published date
        published = tree.xpath('//time[starts-with(@class, "timestamp")]/text()')
        if published:
            published = parse(published[0].split(":",1)[1], tzinfos=tzinfos)
        else:
            print("skipping due to bad date")
            continue    #date not valid, so skip
        if published < cutoffDate:
            print("skipping due to old date")
            continue
        #get the body
        try:
            body = " ".join(tree.get_element_by_id('js-article__body').text_content().split())
        except:
            print("skipping due to bad body")
            continue    #body not valid, so skip

        jsonData['article'].append({
            'url': url,
            'published': published.timestamp(),
            'headline': headline,
            'body': body
        })

        with open('marketwatch-data' + str(dataWritten) + '.json', 'w') as outfile:
            json.dump(jsonData, outfile)

        dataWritten += 1
            
        print('Headline: ', headline)
        print('Published: ', published)
        #print('Body: ', body[0:550])
        
    #print('Links: ', urls[0:20])
    for link in urls:
        if link.startswith("/story/"):
            link = "https://www.marketwatch.com" + link
        if "https://www.marketwatch.com/story/" in link and not "/tools/" in link:
            link = link.split("?", 1)[0]
            if not link in visitedSites:
                visitedSites.add(link)
                toBeProcessed.append(link)

    documentsProcessed += 1
    print("Documents processed:", documentsProcessed, "remaining:", len(toBeProcessed))

    
print("links: ", len(visitedSites))
