require('dotenv').config();

var Snoowrap = require('snoowrap');
var Snoostorm = require('snoostorm');
var request = require('request');
var cheerio = require('cheerio');
var pinderData = require('./pinderData')
var fs = require('fs')

var r = new Snoowrap({
    userAgent: 'stats-bot:v1.0.0',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS

});

var url = "https://www.baseball-reference.com/players/gl.fcgi?id=pindech01&t=b&year=2017";
request(url, function(error, response, html){

        if(!error){
            var $ = cheerio.load(html);
            var template = 'tbody > tr:last-child ';
            var json = getData($,template);

            //check if there are 2 games then create second object to push and post on reddit
            dblHeader = "(2)"
            if (json.date.includes(dblHeader)){
              var template = 'tbody > tr:last-child(2) ';
              var json2 = getData($, template);

            }

            //error checking to see if post has already been made
            var size = pinderData.length;
            if (pinderData[size-1].date != json.date){

              if (json2){
                pinderData.push(json2)

                var header = createPost(json2);
                post(header);

              };
             pinderData.push(json);
             var header = createPost(json);
             post(header);

             fs.writeFile('pinderData.json', JSON.stringify(pinderData, null, 4), function(err){})
          }
            console.log("Done.")
        }
      });

function getData($, template){

    var json = {
      "date": "",
      "PA": "",
      "AB": "",
      "R": "",
      "H": "",
      "RBI": "",
      "BA": "",
      "OBP": "",
      "SLG": ""
    };

    var date = json.date=$(template + "td[data-stat='date_game']").text();
              json.PA=$(template + "td[data-stat='PA']").text();
              json.AB=$(template + "td[data-stat='AB']").text();
              json.R=$(template + "td[data-stat='R']").text();
              json.H=$(template + "td[data-stat='H']").text();
              json.RBI=$(template + "td[data-stat='RBI']").text();
              json.BA=$(template + "td[data-stat='batting_avg']").text();
              json.OBP=$(template + "td[data-stat='onbase_perc']").text();
              json.SLG=$(template + "td[data-stat='onbase_plus_slugging']").text();

    return json;

};

function createPost(json){
  var header = 'Pinder Status ';
  for (i in json){
    if (json.hasOwnProperty(i)){
      if (i=='date'){
        header+= json[i]  +  ': '
      }
      else if(i=='BA'){
        header += 'Batting line: ' + json[i];
        header += '/';
      }
      else if(i=='OBP'){
        header += json[i] + '/';
      }
      else if(i=='SLG'){
        header+= json[i];
      }
      else{
      header += i + ': ';
      header += json[i] + ', ';
      }
    }
  }

  return header;
}

function post(header){
  r.getSubreddit('lifeOfADon').submitSelfpost({
        title: header,
        text: "Today's statistics for Pinder!"
  }).then(console.log);
}
