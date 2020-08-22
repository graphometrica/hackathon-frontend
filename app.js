'use strict';
function Median(data) {
  return Quartile_50(data);
}

function Quartile_25(data) {
  return Quartile(data, 0.25);
}

function Quartile_50(data) {
  return Quartile(data, 0.5);
}

function Quartile_75(data) {
  return Quartile(data, 0.75);
}

function Quartile(data, q) {
  data=Array_Sort_Numbers(data);
  var pos = ((data.length) - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  if( (data[base+1]!==undefined) ) {
    return data[base] + rest * (data[base+1] - data[base]);
  } else {
    return data[base];
  }
}

function Array_Sort_Numbers(inputarray){
  return inputarray.sort(function(a, b) {
    return a - b;
  });
}

function Array_Sum(t){
   return t.reduce(function(a, b) { return a + b; }, 0); 
}

function Array_Average(data) {
  return Array_Sum(data) / data.length;
}

function Array_Stdev(tab){
   var i,j,total = 0, mean = 0, diffSqredArr = [];
   for(i=0;i<tab.length;i+=1){
       total+=tab[i];
   }
   mean = total/tab.length;
   for(j=0;j<tab.length;j+=1){
       diffSqredArr.push(Math.pow((tab[j]-mean),2));
   }
   return (Math.sqrt(diffSqredArr.reduce(function(firstEl, nextEl){
            return firstEl + nextEl;
          })/tab.length));  
}

const openModal = async (inn) => {
  //alert(inn)
  console.log(inn);
  
  $('#modalLabel').text(`ИНН: ${inn}`);

  let url = `https://hackathon.graphometrica.ai/explanations/${inn}.html`//`explanations/${inn}.html`;
  //const html = await fetch(`explanations/${inn}.html`).then(r=>r.text());

    $('.modal').on('shown.bs.modal',function(){      //correct here use 'shown.bs.modal' event which 
      $(this).find('iframe').attr('src', url)
    })
  
  // $('#companyExp').attr('src', `explanations/${inn}.html`);
  // $('#companyExp').removeClass('invisible');
  
  $('#companyModal').modal();

}



const main = async () => {

 let source = await fetch('https://hackathon.graphometrica.ai/api/getAll').then(r => r.json());
  
  let preds = [...new Set(source.map(i=>i.preds))]
  let k = 0;//Quartile(preds, 0.3);

  const filterByScore = (data) => {    
    return data.filter(i=> i.preds > 0.1).sort((a,b) => a.preds-b.preds)
  }


source = filterByScore(source);

 preds = [...new Set(source.map(i=>i.preds))]

  const predMin = d3.min(preds)
  const predMax = d3.min(preds)

  
  

  // var scale = d3.scaleLinear()
  // .domain([predMin, predMax])
  // .range([1, 5]);

  
  
  const colorFn = d3.scaleSequential()
  .interpolator(d3.interpolatePurples)
  .domain([predMin/10, 0.6 ]);
  
   //.range(d3.interpolateBlues)
  // .interpolate(d3.interpolateRgb.gamma(2.2))
  

  function RGBToHex(rgb) {
    
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    
    rgb = rgb.substr(4).split(")")[0].split(sep);
  
    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);
  
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
  
    return "#" + r + g + b;
  }

  

    ymaps.ready(init);

    const getPos = (i) => {
        let parts = i.split(' ');

        return {
            lat: parts[0],
            lon: parts[1]
        }
    }

    let markers = [];

    const drawMarkers = () => {
        
        let boundsCollection = new ymaps.GeoObjectCollection();

        source.forEach(item => {
            let geo = getPos(item.location);
            
            
            
            let marker = new ymaps.Placemark([geo.lat, geo.lon],
            {
                balloonContentHeader: item.name,
                balloonContentBody: `
                · ${item.okved_name.length > 128 ? item.okved_name.substr(0,128) + '...' : item.okved_name }
                <br/>· ИНН: ${item.inn}
                <br/>· ОГРН: ${item.ogrn}
                <br/>· адрес: ${item.city? item.city+ ', ' : ''} ${item.address}
                <br/><br/>· <b>score: ${Math.round(item.preds*1000)/1000}</b>
                <br/><br/><button class='modal-btn' onclick="openModal('${item.inn}')" >Посмотреть детали</button>
                `
            }, {
                hideIconOnBalloonOpen: false,
                preset: "islands#greenDotIconWithCaption",
                iconColor: colorFn(item.preds),
            });
             
              markers.push({
                item: item,
                marker: marker
              });
        
            boundsCollection.add(marker);
            //console.log(geo);
        })    

        //console.log(boundsCollection.length)

        myMap.geoObjects.add(boundsCollection);

        // myMap.setBounds(boundsCollection.getBounds(), { checkZoomRange: true, useMapMargin: true, zoomMargin: 150 });
        // myMap.geoObjects.remove(boundsCollection);
    }

    function init() {
        let myMap = new ymaps.Map("map", {
            center: [ 47.728732, 41.268128 ],
            zoom: 7
        }, {
            searchControlProvider: 'yandex#search'
        });

        window.myMap = myMap;

        let query = null;
        query = ymaps.geoQuery(ymaps.regions.load("RU", { lang: "ru" }));
        query.then(() => {
            drawRegionContour(query, "Ростовская область");
        });

        //drawRegionContour(query, "Ростовская область");

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
        
            item.setOptions("strokeColor", "#3388ff");
        
            // item.setOptions("strokeColor", "#999999");
            item.setOptions("strokeStyle", "shortdash");
            
            item.setOptions("strokeWidth", 3);
            
        
            item.each(i => {
                
                if (!window.region) window.region = [];
                window.myMap.geoObjects.add(i);        
            });
        }
        

        drawMarkers();
    }        
};

$(document).ready(main);