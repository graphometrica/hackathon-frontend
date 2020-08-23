(() => {
  'use strict';

  let clusterer = null;
  const competition = {};
  const competitionByLocation = {};
  let compMin = 0;
  let compMax = 0;
  let compScale = null;
  let scoreLevelScale = null

  const calculateCompetition = (data) => {
    data.forEach(i=> {
      
      if (!competition[i.okved_code]) {
        competition[i.okved_code]=[getPos(i.location)]
      }else {
        competition[i.okved_code].push(getPos(i.location))
      }
    })

    data.forEach(i=> calculateCompetitionByGeo(i))

    
    let compLevels = Object.keys(competitionByLocation).map(key=>competitionByLocation[key]);

    compMin = d3.min(compLevels);
    compMax = d3.max(compLevels);

    compScale = d3.scaleLinear()
        .domain([compMin, compMax])
        .rangeRound([0, 3])
            
  }

  const getCompetitionLevelLabel = (compLevel) => {
   
    return `${compLevel} шт.`    
  }

  const scoreLevelScaleText = (score, color) => {    
    let level = scoreLevelScale(score);

    if (level == 1) return 'ниже среднего'
    if (level == 2) return 'средний'
    if (level == 3) return 'выше среднего'
    if (level == 4) return 'высокий'
    if (level == 0) return 'низкий'
  }

  const scoreLevelScaleLabel = (score, color) => {
    
    let level = scoreLevelScale(score);


    let star = `<svg xmlns="http://www.w3.org/2000/svg" fill="${color}" width="16" height="16" viewBox="0 0 32 32"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>`

    if (level == 0) return `${star}`
    if (level == 1) return `${star}${star}`
    if (level == 2) return `${star}${star}${star}`
    if (level == 3) return `${star}${star}${star}${star}`
    if (level == 4) return `${star}${star}${star}${star}${star}`

    
  }

  const getCompetitionLevel = (item) => {
    
    let geo = getPos(item.location);
    
    let count = competitionByLocation[`${geo.lat};${geo.lon}`];  
    return count;  
    // let compLevel = compScale(count);
        
    // return compLevel;
  }

  

  const calculateCompetitionByGeo = (item) => {
    let geo = getPos(item.location);
    
    const locations = competition[item.okved_code];
    
    let count = locations.map(i=> GetGEODistance(geo.lat, geo.lon, i.lat, i.lon))
      .filter(i=>i<=15).length;

      if (count.length) count--;

      competitionByLocation[`${geo.lat};${geo.lon}`] = count;
      

  }
    
    const initMap = async () => {
      let myMap = new ymaps.Map("map", {
          center: [ 47.728732, 41.268128 ],
          zoom: 7
      }, {
          searchControlProvider: 'yandex#search'
      });

      //  clusterer = new ymaps.Clusterer({
      //   clusterIconLayout: 'default#pieChart',
      //   clusterIconPieChartRadius: 35,
      //   clusterIconPieChartCoreRadius: 25,
      //   clusterIconPieChartStrokeWidth: 3,
      //   hasBalloon: true,
      //     clusterHideIconOnBalloonOpen: false,
      //     // geoObjectHideIconOnBalloonOpen: false
      // });

      

      

      
        
      window.myMap = myMap;
    
      let query = null;
      query = ymaps.geoQuery(ymaps.regions.load("RU", { lang: "ru" }));
      query.then(async () => {
          drawRegionContour(query, "Ростовская область");
          await loadApp();
          
      });
    
    }
    
    const drawRegionContour = (query, regionName) => {
    
      if (query) {
          let item = query.search(`properties.name = "${regionName}"`);
    
          item.setOptions("visible", true);
          item.setOptions("fillOpacity", 0);
          item.setOptions("outline", true);
      
          item.setOptions("hasBalloon", false);
          item.setOptions("hasHint", false);
          item.setOptions("interactivityModel", "default#transparent");
      
          item.setOptions("strokeColor", "#3f007d");
      
          // item.setOptions("strokeColor", "#999999");
          item.setOptions("strokeStyle", "shortdash");
          
          item.setOptions("strokeWidth", 3);
          
      
          item.each(i => {
              
              if (!window.region) window.region = [];
              window.myMap.geoObjects.add(i);        
          });
      }
      
    
      
    }
    
    let markers = [];
    
    const drawMarkers = (data, colorFn, scale) => {
      
      let boundsCollection = new ymaps.GeoObjectCollection();
      
      data.forEach(item => {                        
          let marker = addMarker(item, colorFn);  

          if (marker) {
              markers.push({
                item: item,
                marker: marker
              });  
              boundsCollection.add(marker);
              
              markers.push(marker);
          }
            
          
      })  
      
      //clusterer.add(markers.map(i=>i.marker).filter(i=>i));
        
      // myMap.geoObjects.add(clusterer);
      // myMap.setBounds(clusterer.getBounds(), {
      //     checkZoomRange: true
      // });
      myMap.geoObjects.add(boundsCollection);  
    }


    const writeLinks = (item) => {
      let result = ``;
      if (item.website) {
        result = ''
      }

      if (item.website) {
        let url = item.website.trim();
        if (url.toLowerCase().indexOf('http') != 0) {
          url = 'http://' + url
        }

        result = `${result}<br/>· сайт: <a href="${url}" target="_blank">${url}</a>`;
      } 
      return result;
    }

    const getMarkerIcon = (item) => {
      let okved = item.okved_name.toLowerCase();

      if (okved.indexOf('баз данных')>=0
      || okved.indexOf('защиты информации')>=0
      || okved.indexOf('нтернет')>=0
      || okved.indexOf('компьютер')>=0
      || okved.indexOf('информационных технологий')>=0
      || okved.indexOf('программного обеспечения')>=0
      
      ) return 'hourglass';

      if (okved.indexOf('науч')>=0  
        || okved.indexOf('наук')>=0     
      ) return 'star';

      // if (okved.indexOf('выращ')>=0  
      //   || okved.indexOf('виног')>=0  
      //   || okved.indexOf('виног')>=0
      //   || okved.indexOf('нерафин')>=0
      //   || okved.indexOf('рафин')>=0
      //   || okved.indexOf('приправ')>=0
      //   || okved.indexOf('зерновых культур')>=0
      // ) return 'leaf';



      return '';
    }

    const yearRus = (year) => {
      let end = year.substring(0,2)*1;

      if (end > 20) {
        end = (end+"").substring(1,2)*1;
        
        console.log(end)
      }

      if (end == 1) return 'год'
      if (end == 2 || end == 3 || end == 4) return 'года'
      if (end >= 5 < 20) return 'лет'
      
      return 'лет'
      
    }

    const yearDiffLabel =(year) => {
      let diff = new Date().getFullYear()-year*1;
        if (diff > 0) return `<span class="badge badge-secondary">${diff} ${yearRus(year+'')}</span>`
        return '';
    }

    const writeEmplNumber = (item) => {
      if (!item.employee_number) return '';
      return `<br/>· Кол-во сотрудников: ${encodeURIComponent(item.employee_number)}`;
    }

    const writeProceed = (item) => {
      if (!item.proceed) return '';
      return `<br/>· Выручка за последний год: ${encodeURIComponent(item.proceed)} тыс. руб.`;
    }

    const normalizeUrl = (url) => {
      if (url.indexOf('http') !== 0) {
        return `https://${url}`
      }
      return url;
    }

    const writeSocnetworks = (item) => {
  
      if (!item.soc_networks) return '';

      let result = '<br/><div style="margin-top:10px">';

      let parts = item.soc_networks.split(', ').map(i=>i.trim()).filter(i=>i);

      

      parts.forEach(i=> {
        if (i.indexOf('vk.ru') >=0 || i.indexOf('vk.com') >=0 || i.indexOf('http://vkontakte.ru') >=0) {
          result = result +`<div style="float:left;height:24px;width:24px; margin-left: 10px;">
          <a href='${normalizeUrl(i)}' target='_blank'><img src='pics/vk.svg'></a></div>`;
        }else if (i.indexOf('fb.com') >=0 || i.indexOf('facebook.com') >=0 ) {
          result = result +`<div style="float:left;height:24px;width:24px; margin-left: 10px;">
          <a href='${normalizeUrl(i)}' target='_blank'><img src='pics/facebook.svg'></a></div>`;
        }else if (i.indexOf('instagram.com') >=0 ) {
          result = result +`<div style="float:left;height:24px;width:24px; margin-left: 10px;">
          <a href='${normalizeUrl(i)}' target='_blank'><img src='pics/instagram.svg'></a></div>`;
        }else if (i.indexOf('twitter') >=0 ) {
          result = result +`<div style="float:left;height:24px;width:24px; margin-left: 10px;">
          <a href='${normalizeUrl(i)}' target='_blank'><img src='pics/twitter.svg'></a></div>`;
        }
      })

      result = result +'</div>'
      return result;
      
      

      

      result = result +`<div style="float:left;height:24px;width:24px; margin-left: 10px;">
      <a href='' target='_blank'><img src='pics/facebook.svg'></a></div>`;

      result = result +`<div style="float:left;height:24px;width:24px; margin-left: 10px;">
      <a href='' target='_blank'><img src='pics/twitter.svg'></a></div>`;

      
    }

    const addMarker = (item, colorFn, scale) => {
      let geo = getPos(item.location);
            
      let color = colorFn(item.preds);

      let level = getCompetitionLevel(item);
      // <br/>${scoreLevelScaleLabel(item.preds, color)}
      let marker = new ymaps.Placemark([geo.lat, geo.lon],
        {
            balloonContentHeader: `${item.name}${item.city ? ` (` + item.city +')' : ''}, основана в&nbsp;${item.create_year} ${yearDiffLabel(item.create_year)}
            `,
            balloonContentBody: `
            <b>${item.okved_name.length > 128 ? item.okved_name.substr(0,128) + '...' : item.okved_name }</b> 
            <br/><span >· организаций с таким же ОКВЭД в радиусе 15 км: ${getCompetitionLevelLabel(level)}</span>
            <br/>            
            <br/>· ИНН: ${item.inn}
            <br/>· ОГРН: ${item.ogrn}
            <br/>· ОКВЭД: ${item.okved_code}
            ${writeEmplNumber(item)}
            ${writeProceed(item)}
            <br/>
                        
            <br/>· адрес: ${item.city? item.city+ ', ' : ''} ${item.address}            
            ${writeLinks(item)}
            ${writeSocnetworks(item)}
            <br/><br/>
            <svg width="16" height="16">
              <rect width="16" height="16" style="fill:${color};" />
            </svg>&nbsp;
            <b>Innovation score: ${Math.round(item.preds*1000)/1000}</b>&nbsp; (${scoreLevelScaleText(item.preds, color)})
            <br/>
            <br/><a class='my-primary-btn'
             href="https://hackathon.graphometrica.ai/explain/?inn=${item.inn}"
             target="_blank">Почему такой innovation score? →</a>
            `
        }, {
            hideIconOnBalloonOpen: false,
            preset: 'islands#glyphIcon',
            iconGlyph: getMarkerIcon(item),
            iconGlyphColor: colorFn(item.preds),
            iconColor: colorFn(item.preds),
        });

      //   marker.events.add('click', function () {
      //     getCompetition(item, marker)
      // });

        return marker;
    }
    
    const normalizeBackendData = (data) => {      
      
      let result = data.filter(i=>i.location)
        .map(i=> {
          let location = i.location;
          
          if (location.indexOf(', ') >= 0) location = location.split(', ')[0]
          return {...i, location: location}
        })
        
      return result;
    }

    const filterByLowPreds = (data) => {
      return data.filter(i=> i.preds > 0.1).sort((a,b) => a.preds-b.preds)
    }
    
    
    const getPos = (i) => {
      let parts = i.split(' ');
    
      return {
          lat: parts[0],
          lon: parts[1]
      }
    }
    
    const loadApp = async () => {
    
      
    let raw = await fetch('https://hackathon.graphometrica.ai/api/getAll')
    .then(r => r.json())
    
      let data = normalizeBackendData(raw);      
      calculateCompetition(data);
      data = filterByLowPreds(data);
    
      let preds = [...new Set(data.map(i=>i.preds))]
    
      const predMin = d3.min(preds)
      const predMax = d3.max(preds)

      
      
      // const colorFn = d3.scaleSequential()
      //   .interpolator(d3.interpolatePurples)
      //   .domain([predMin, predMax ]);

      const colorFn = d3.scaleSequential()
      .domain([predMin, predMax])
      .interpolator(d3.interpolate("#dfcfe6", "#430775"));
//3f007d
        var scale = d3.scaleLinear()
          .domain([predMin, predMax])
          .range([0, 1]);

          scoreLevelScale  = d3.scaleLinear()
        .domain([scale(predMin), scale(predMax)])
        .rangeRound([0, 4])

          data.forEach(i=>i.preds = scale(i.preds))
        
        drawMarkers(data, colorFn, scale);         
    };
    
    $(document).ready(() => {
      ymaps.ready(initMap);    
    });

})();

