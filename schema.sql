DROP TABLE geoloc;

DROP TABLE forecast;

DROP TABLE eventbrite;

CREATE TABLE geoloc (latitude DECIMAL, longitude DECIMAL, formatted_query VARCHAR(255), search_query VARCHAR(255));

CREATE TABLE forecast (forecast VARCHAR(255), time VARCHAR(255));

CREATE TABLE eventbrite(link VARCHAR(500), name VARCHAR(255), event_date VARCHAR(255), summary VARCHAR(255));