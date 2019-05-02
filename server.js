'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');


const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.static('./public'));


//database setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();


//API routes
app.get('/', (request, response) => {
  response.send('server works');
});

app.get('/location', getLocation);


//constructor functions
function GEOloc(query, res) {
  this.search_query = query;
  this.formatted_query = res.results[0].formatted_address;
  this.latitude = res.results[0].geometry.location.lat;
  this.longitude = res.results[0].geometry.location.lng;
}


function Forecast(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}

function Event(data){
  this.link = data.link;
  this.name = data.name.text;
  this.event_date = data.start.local;
  this.summary = data.summary;
}


//helper functions
function handleError(error) {
  return { 'status': 500, 'responseText': 'Sorry, something went wrong' };
}

function getLocation(request, response){
  const queryData = request.query.data;
  let sqlStatement = 'SELECT * FROM geoloc WHERE search_query = $1;';
  let values = [queryData];
  
  return client.query(sqlStatement, values)
    .then( data => {
      console.log(`accessed .then of return client`);

      if(data.rowCount > 0) {
        console.log(`sending data from database`);
        return data.rows[0];
      } else {
        let geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${queryData}&key=${process.env.GEOCODE_API_KEY}`;

        return superagent.get(geocodeURL)
          .then( res => response.send(new GEOloc(queryData, res.body)))
          .catch(error => handleError(error));
      }
    });
}




app.get('/weather', (request, response) => {
  console.log(request.query.data);
  try {
    let weatherURL = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
    superagent.get(weatherURL)
      .end((err, res) => {
        let daily = Object.entries(res.body)[6];
        let dailyData = daily[1].data;//hourly day forecast
        let myForecast = dailyData.map( element => {
          let date = new Date(element.time * 1000).toDateString();
          let temp = new Forecast(element.summary, date);
          return temp;
        });
        response.send(myForecast);
      });
  } catch (error) {
    response.send(handleError);
  }
});

app.get('/events', (request, response) => {
  try {
    let eventbriteURL = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&expand=venue`;
    superagent.get(eventbriteURL)
      .set('Authorization', `Bearer ${process.env.PERSONAL_TOKEN}`)
      .then( result => {
        const eventSummaries = result.body.events.map(item => {
          const summary = new Event(item);
          return summary;
        });
        response.send(eventSummaries);
      });
  } catch (error) {
    response.send(handleError);
  }
});

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));