$(function(){
  
  /* Configuration */
  
  var APPID = '8vq9HG30';   // Your Yahoo APP id
  var DEG = 'c';    // c for celsius, f for fahrenheit
  
 // Mapping the weather codes returned by Yahoo's API
  // to the correct icons in the img/icons folder
  
  var weatherIconMap = [
    'storm', 'storm', 'storm', 'lightning', 'lightning', 'snow', 'hail', 'hail',
    'drizzle', 'drizzle', 'rain', 'rain', 'rain', 'snow', 'snow', 'snow', 'snow',
    'hail', 'hail', 'fog', 'fog', 'fog', 'fog', 'wind', 'wind', 'snowflake',
    'cloud', 'cloud_moon', 'cloud_sun', 'cloud_moon', 'cloud_sun', 'moon', 'sun',
    'moon', 'sun', 'hail', 'sun', 'lightning', 'lightning', 'lightning', 'rain',
    'snowflake', 'snowflake', 'snowflake', 'cloud', 'rain', 'snow', 'lightning'
  ];
  
  var weatherDiv = $('#weather'),
    scroller = $('#scroller'),
    location = $('p.location');
  
  // Does this browser support geolocation?
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
  }
  else{
      showError("Your browser does not support Geolocation!");
  }
  
  // Get user's location, and use Yahoo's PlaceFinder API
  // to get the location name, woeid and weather forecast
  
  function locationSuccess(position) {
      var lat = position.coords.latitude;
      var lon = position.coords.longitude;

      // Yahoo's PlaceFinder API http://developer.yahoo.com/geo/placefinder/
      // We are passing the R gflag for reverse geocoding (coordinates to place name)
      var geoAPI = 'http://where.yahooapis.com/geocode?location='+lat+','+lon+'&flags=J&gflags=R&appid='+APPID;
      
      // Forming the query for Yahoo's weather forecasting API with YQL
      // http://developer.yahoo.com/weather/
      
      var wsql = 'select * from weather.forecast where woeid=WID and u="'+DEG+'"',
          weatherYQL = 'http://query.yahooapis.com/v1/public/yql?q='+encodeURIComponent(wsql)+'&format=json&callback=?',
          code, city, results, woeid;
      
      if (window.console && window.console.info){
        console.info("Coordinates: %f %f", lat, lon);
      }
      
      // Issue a cross-domain AJAX request (CORS) to the GEO service.
      // Not supported in Opera and IE.
      $.getJSON(geoAPI, function(r){
         
          if(r.ResultSet.Found == 1){
            
              results = r.ResultSet.Results;
              city = results[0].city;
              code = results[0].statecode || results[0].countrycode;
      
              // This is the city identifier for the weather API
              woeid = results[0].woeid;
  
              // Make a weather API request:
              $.getJSON(weatherYQL.replace('WID',woeid), function(r){
                
                  if(r.query && r.query.count == 1){
                    
                    // Create the weather items in the #scroller UL
                    
                      var item = r.query.results.channel.item.condition;
                      
                      if(!item){
                        showError("We can't find weather information about your city!");
                        if (window.console && window.console.info){
                  console.info("%s, %s; woeid: %d", city, code, woeid);
                }
                
                return false;
                      }
                      
                      addWeather(item.code, "Now", item.text + ' <b>'+item.temp+'°'+DEG+'</b>');
                      
                      for (var i=0;i<2;i++){
                          item = r.query.results.channel.item.forecast[i];
                          addWeather(
                            item.code, 
                            item.day +' <b>'+item.date.replace('\d+$','')+'</b>',
                            item.text + ' <b>'+item.low+'°'+DEG+' / '+item.high+'°'+DEG+'</b>'
                          );
                      }
                      
                      // Add the location to the page
                      location.html(city+', <b>'+code+'</b>');
                      
                      weatherDiv.addClass('loaded');
                      
                      // Set the slider to the first slide
                      showSlide(0);
                 
                  }
                  else {
                      showError("Error retrieving weather data!");
                  }
              });
      
          }
          
      }).error(function(){
        showError("Your browser does not support CORS requests!");
      });
     
  }
  
  function addWeather(code, day, condition){
    
      var markup = '<li>'+
        '<img src="assets/img/icons/'+ weatherIconMap[code] +'.png" />'+
        ' <p class="day">'+ day +'</p> <p class="cond">'+ condition +
        '</p></li>';
      
      scroller.append(markup);
  }
  
  /* Handling the previous / next arrows */
  
  var currentSlide = 0;
  weatherDiv.find('a.previous').click(function(e){
    e.preventDefault();
    showSlide(currentSlide-1);
  });
  
  weatherDiv.find('a.next').click(function(e){
    e.preventDefault();
    showSlide(currentSlide+1);
  });
  
  
  function showSlide(i){
    var items = scroller.find('li');
    
    if (i >= items.length || i < 0 || scroller.is(':animated')){
      return false;
    }
    
    weatherDiv.removeClass('first last');
    
    if(i == 0){
      weatherDiv.addClass('first');
    }
    else if (i == items.length-1){
      weatherDiv.addClass('last');
    }
    
    scroller.animate({left:(-i*100)+'%'}, function(){
      currentSlide = i;
    });
  }
  
  /* Error handling functions */
  
  function locationError(error){
      switch(error.code) {
      case error.TIMEOUT:
        showError("A timeout occured! Please try again!");
        break;
      case error.POSITION_UNAVAILABLE:
        showError('We can\'t detect your location. Sorry!');
        break;
      case error.PERMISSION_DENIED:
        showError('Please allow geolocation access for this to work.');
        break;
      case error.UNKNOWN_ERROR:
        showError('An unknown error occured!');
        break;
    }
        
    }
    
  function showError(msg){
    weatherDiv.addClass('error').html(msg);
  }

});
