function getColor(type) {
	if ('認可保育所' == type){
		return '#6EE100';
	} else if ('認可外' == type){
		return '#0362A0';
	} else if ('幼稚園' == type){
		return '#FF5C24';
	} else if ('認定こども園' == type){
		return '#FFEE24';
	}
	return 'rgba(153, 153, 153, 1)';
}

// 保育所スタイル
var nurseryStyleFunction = function(feature, resolution) {
	var radius = 15;
	var type   = feature.get('種別');
	var background = new ol.style.Circle({
		radius: radius,
		fill: new ol.style.Fill({
			color: getColor(type)
		}),
		stroke: new ol.style.Stroke({color: 'white', width: 3})
	});
	var image = new ol.style.Icon({
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: 'image/018.png',
		// scale: 0.5
	});

	resolution = Math.floor(resolution * 1000);
	var _type = "";
	switch(feature.get('種別')) {
		case '認可外':
			_type = feature.get('種別')[2];
			break;
		default:
			_type = feature.get('種別')[0];
			break;
	}

	var text = resolution < 10000 ? "[" + _type + "]" + feature.get('ラベル') : '';
	var style = [];
	if (text !== "") {
		style = [
			new ol.style.Style({image: background}),
			new ol.style.Style({
				text: new ol.style.Text({
					offsetY: -20.0,
					text: text,
					font: '14px sans-serif',
					fill: new ol.style.Fill({
						color: '#000'
					}),
					stroke: new ol.style.Stroke({
						color: '#FFF',
						width: 3
					})
				}),
				image: image,
			}),
		];
	} else {
		style = [
			new ol.style.Style({image: background}),
			new ol.style.Style({image: image}),
		];
	}
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

// 距離計測用同心円の色設定
var circleStyleFunction = function(feature, resolution) {
	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(255, 0, 0, 0.4)',
			width: 1
		}),
		fill: new ol.style.Fill({
			color: 'rgba(255, 0, 0, 0.2)'
		})
	})];
	return style;
};
