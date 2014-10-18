function getFeatureStyle(type) {
	if ('認可保育所' == type){
		return {
			color: '#6EE100',
			img: 'image/018.png'
		};
	} else if ('認可外' == type){
		return {
			color: '#0362A0',
			img: 'image/019.png'
		};
	} else if ('幼稚園' == type){
		return {
			color: '#FF5C24',
			img: 'image/029.png'
		};
	} else if ('認定こども園' == type){
		return {
			color: '#FFEE24',
			img: 'image/018.png'
		};
	}
	return {
		color: 'rgba(153, 153, 153, 1)',
		img: 'image/018.png'
	};
}

// 保育所スタイル
var nurseryStyleFunction = function(feature, resolution) {
	var radius = 15;
	var type   = feature.get('種別');
	var featureStyle = getFeatureStyle(type);
	var background = new ol.style.Circle({
		radius: radius,
		fill: new ol.style.Fill({
			color: featureStyle.color
		}),
		stroke: new ol.style.Stroke({color: 'white', width: 3})
	});
	var image = new ol.style.Icon({
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: featureStyle.img,
		scale: 0.5
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
	style = [
		new ol.style.Style({image: background}),
		new ol.style.Style({image: image}),
	];

	if (text !== "") {
		style.push(
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
				})
			})
		);
	}
	return style;
};

/**
 * ベースの校区スタイルを戻す関数
 * @param  {[type]} mojicolor [description]
 * @param  {[type]} fillcolor [description]
 * @return {[type]}           [description]
 */
function baseSchoolStyle(mojicolor, fillcolor) {
	return function(feature, resolution) {
		var image = new ol.style.Icon({
			anchor: [0.5, 0.5],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction',
			src: 'image/school.png',
			// scale: 0.5
		});

		var background = new ol.style.Circle({
			radius: 15,
			fill: new ol.style.Fill({
				color: mojicolor
			}),
			stroke: new ol.style.Stroke({color: 'white', width: 3})
		});

		var style = [
			new ol.style.Style({image: background}),
			new ol.style.Style({image: image}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: mojicolor,
					width: 1
				}),
				fill: new ol.style.Fill({
					color: fillcolor
				})
			})
		];

		resolution = Math.floor(resolution * 1000);
		var text = "";
		if(feature.get('label') !== null) {
			text = resolution < 12000 ? feature.get('label') : '';
		}
		if (text !== "") {
			style.push(
					new ol.style.Style({
						text: new ol.style.Text({
							offsetY: -25.0,
							text: text,
							font: '13px sans-serif',
							fill: new ol.style.Fill({
								color: mojicolor
							}),
							stroke: new ol.style.Stroke({
								color: '#FFF',
								width: 3
							})
						})
					})
				);
		}
		return style;
	};
}

// 中学校区スタイル
var middleSchoolStyleFunction = baseSchoolStyle(
	'#7379AE', 'rgba(115, 121, 174, 0.1)');

// 小学校区スタイル
var elementaryStyleFunction = baseSchoolStyle(
	'#1BA466', 'rgba(27, 164, 102, 0.1)');

// 距離計測用同心円の色設定
var circleStyleFunction = function(feature, resolution) {
	resolution = Math.floor(resolution * 1000);
	var text = "";
	if(feature.get('name') !== null) {
		text = resolution < 100000 ? feature.get('name') : '';
	}
	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(255, 0, 0, 0.4)',
			width: 1
		}),
		fill: new ol.style.Fill({
			color: 'rgba(255, 0, 0, 0.2)'
		}),
		text: new ol.style.Text({
			offsetY: -40.0,
			text: text,
			font: '20px sans-serif',
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 0, 0.4)'
			}),
			stroke: new ol.style.Stroke({
				color: '#FFF',
				width: 3
			})
		})
	})];
	return style;
};
