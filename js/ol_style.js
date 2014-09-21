/*
var image = new ol.style.Circle({
  radius: 10,
  fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 1)'
  }),
  stroke: new ol.style.Stroke({color: 'red', width: 1})
});

var styles = {
  'Point': [new ol.style.Style({
    image: image
  })],
  'LineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 1
    })
  })],
  'MultiLineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 1
    })
  })],
  'MultiPoint': [new ol.style.Style({
    image: image
  })],
  'MultiPolygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  })],
  'Polygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      lineDash: [4],
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  })],
  'GeometryCollection': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'magenta',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'magenta'
    }),
    image: new ol.style.Circle({
      radius: 10,
      fill: null,
      stroke: new ol.style.Stroke({
        color: 'magenta'
      })
    })
  })],
  'Circle': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.2)'
    })
  })]
};

var styleFunction = function(feature, resolution) {
  return styles[feature.getGeometry().getType()];
};
*/
// 保育所スタイル
var nurseryStyleFunction = function(feature, resolution) {
	var radius = 10;
	var type = feature.get('種別');
	if ('認可保育所' == type){
		radius = 8;
	} else if ('認可外保育所' == type){
		radius = 6;
	}
	var image = new ol.style.Circle({
		radius: radius,
		fill: new ol.style.Fill({
			color: 'rgba(0, 255, 0, 1)'
		}),
		stroke: new ol.style.Stroke({color: 'black', width: 1})
	});
	var style = [new ol.style.Style(
		{image: image}
	)];
	return style;
};
// 中学校区スタイル
var middleSchoolStyleFunction = function(feature, resolution) {
	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
		color: 'blue',
		//lineDash: [4],
		width: 1
		}),
		fill: new ol.style.Fill({
			color: 'rgba(0, 0, 255, 0.05)'
		})
	})];
	return style;
};
// 小学校区スタイル
var elementaryStyleFunction = function(feature, resolution) {
	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
		color: 'green',
		//lineDash: [4],
		width: 1
		}),
		fill: new ol.style.Fill({
			color: 'rgba(0, 255, 0, 0.05)'
		})
	})];
	return style;
};