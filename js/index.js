// 地図表示時の中心座標
var init_center_coords = [139.919204, 35.875297];

// Bing APIのキー
var bing_api_key = 'AhGQykUKW2-u1PwVjLwQkSA_1rCTFESEC7bCZ0MBrnzVbVy7KBHsmLgwW_iRJg17';

// map
var map;

// 保育施設JSON格納用オブジェクト
var nurseryFacilities = {};

// 中心座標変更セレクトボックス用データ
var moveToList = [];

// マップサーバ一覧
var mapServerList = {
	'bing-road': {
		label: "標準(Bing)",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Road',
		})
	},
	"cyberjapn-pale": {
		label: "国土地理院",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	'osm': {
		label: "交通",
		source_type: "osm",
		source: new ol.source.OSM({
			url: "http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
			attributions: [
				ol.source.OSM.DATA_ATTRIBUTION,
				new ol.Attribution({html: "Tiles courtesy of <a href='http://www.thunderforest.com/' target='_blank'>Andy Allan</a>"})
			]
		})
	},
	'bing-aerial': {
		label: "写真",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Aerial',
		})
	}
};

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
	var screenHeight = $.mobile.getScreenHeight();
	var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
	var contentHeight = screenHeight - contentCurrentHeight;
	var navHeight = $("#nav1").outerHeight();
	$(".ui-content").height(contentHeight);
	$("#map").height(contentHeight - navHeight);
}

$(window).on("orientationchange", function() {
	resizeMapDiv();
	map.setTarget('null');
	map.setTarget('map');
});


$('#mainPage').on('pageshow', function() {
	resizeMapDiv();

	// 地図レイヤー定義
	var papamamap = new Papamamap();
	papamamap.viewCenter = init_center_coords;
	papamamap.generate(mapServerList['bing-road']);
	map = papamamap.map;

	// 保育施設の読み込みとレイヤーの追加
	papamamap.loadNurseryFacilitiesJson(function(data){
		nurseryFacilities = data;
	}).then(function(){
		papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
	});

	// ポップアップ定義
	var popup = new ol.Overlay({
		element: $('#popup')
	});
	map.addOverlay(popup);

	// 背景地図一覧リストを設定する
	for(var item in mapServerList) {
		option = $('<option>').html(mapServerList[item].label).val(item);
		$('#changeBaseMap').append(option);
	}

	// 最寄駅セレクトボックスの生成
	mtl = new MoveToList();
	mtl.loadStationJson().then(function() {
		mtl.appendToMoveToListBox(moveToList);
	}, function(){
		mtl.loadStationJson().then(function() {
			mtl.appendToMoveToListBox(moveToList);
		});
	});

	// 保育施設クリック時の挙動を定義
	map.on('click', function(evt) {
		if ( $('#popup').is(':visible') ) {
			// ポップアップを消す
			$('#popup').hide();
			return;
		}

		// クリック位置の施設情報を取得
		obj = map.forEachFeatureAtPixel(
			evt.pixel,
			function(feature, layer) {
				return {feature: feature, layer: layer};
			}
		);

		var feature = null;
		var layer   = null;
		if(obj !== undefined) {
			feature = obj.feature;
			layer   = obj.layer;
		}
		// クリックした場所に要素がなんにもない場合、クリック位置に地図の移動を行う
		if (feature === null) {
			coord = map.getCoordinateFromPixel(evt.pixel);
			view = map.getView();
			papamamap.animatedMove(coord[0], coord[1], false);
			view.setCenter(coord);
		}

		// クリックした場所に既に描いた同心円がある場合、円を消す
		if (feature && layer.get('name') === 'layerCircle' &&
			feature.getGeometry().getType() === "Polygon") {
			$('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
			clearCenterCircle();
		}

		// クリックした場所に保育施設がある場合、ポップアップダイアログを出力する
		if (feature && "Point" == feature.getGeometry().getType()) {
			var type = feature.get('種別') ? feature.get('種別') :  feature.get('Type');
			if(type === undefined) {
				return;
			}
			var geometry = feature.getGeometry();
			var coord = geometry.getCoordinates();
			popup.setPosition(coord);

			// タイトル部
			var title = papamamap.getPopupTitle(feature);
			$("#popup-title").html(title);

			// 内容部
			papamamap.animatedMove(coord[0], coord[1], false);
			var content = papamamap.getPopupContent(feature);
			$("#popup-content").html(content);
			$('#popup').show();
			view = map.getView();
			view.setCenter(coord);
		}
	});

	// 中心座標変更セレクトボックス操作イベント定義
	$('#moveTo').change(function(){
		// $('#markerTitle').hide();
		// $('#marker').hide();

		// 指定した最寄り駅に移動
		papamamap.moveToSelectItem(moveToList[$(this).val()]);

		// 地図上にマーカーを設定する
		var lon = moveToList[$(this).val()].lon;
		var lat = moveToList[$(this).val()].lat;
		var label = moveToList[$(this).val()].name;
		var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
		// Vienna marker
		drawMarker(pos, label);
	});

	// 幼稚園チェックボックスのイベント設定
	$('#cbKindergarten').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 認可保育所チェックボックスのイベント設定
	$('#cbNinka').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 認可外保育所チェックボックスのイベント設定
	$('#cbNinkagai').click(function() {
		papamamap.switchLayer(this.id, $(this).prop('checked'));
	});

	// 中学校区チェックボックスのイベント定義
	$('#cbMiddleSchool').click(function() {
		layer = map.getLayers().item(1);
		layer.setVisible($(this).prop('checked'));
	});

	// 小学校区チェックボックスのイベント定義
	$('#cbElementarySchool').click(function() {
		layer = map.getLayers().item(2);
		layer.setVisible($(this).prop('checked'));
	});

	// 現在地に移動するボタンのイベント定義
	$('#moveCurrentLocation').click(function(evt){
		control = new MoveCurrentLocationControl();
		control.getCurrentPosition(
			function(pos) {
				var coordinate = ol.proj.transform(
					[pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857');
				view = map.getView();
				view.setCenter(coordinate);
				drawMarker(coordinate, "現在地");
			},
			function(err) {
				alert('位置情報が取得できませんでした。');
			}
		);
	});

	// 半径セレクトボックスのイベント定義
	$('#changeCircleRadius').change(function(evt){
		radius = $(this).val();
		if(radius === "") {
			clearCenterCircle();
			$('#cbDisplayCircle').prop('checked', false).checkboxradio('refresh');
			return;
		} else {
			$('#cbDisplayCircle').prop('checked', true).checkboxradio('refresh');
			drawCenterCircle(radius);
		}
	});

	// 円表示ボタンのイベント定義
	$('#cbDisplayCircle').click(function(evt) {
		radius = $('#changeCircleRadius').val();
		if($('#cbDisplayCircle').prop('checked')) {
			drawCenterCircle(radius);
		} else {
			clearCenterCircle();
		}
	});

	// 地図変更選択ボックス操作時のイベント
	$('#changeBaseMap').change(function(evt) {
		if($(this).val() === "背景") {
			$(this).val($(this).prop("selectedIndex", 1).val());
		}
		papamamap.changeMapServer(
			mapServerList[$(this).val()], $('#changeOpacity option:selected').val()
			);
	});

	// ポップアップを閉じるイベント
	$('#popup-closer').click(function(evt){
		$('#popup').hide();
		return;
	});

	// ポップアップを閉じる
	$('.ol-popup').parent('div').click(function(evt){
		$('#popup').hide();
		return;
	});

	// 親要素へのイベント伝播を停止する
	$('.ol-popup').click(function(evt){
		evt.stopPropagation();
	});

	// 検索フィルターを有効にする
	$('#filterApply').click(function(evt){
		// 条件作成処理
		conditions = [];
		ninka = ninkagai = kindergarten = false;

		// 認可保育園
		if($('#ninkaOpenTime option:selected').val() !== "") {
			conditions['ninkaOpenTime'] = $('#ninkaOpenTime option:selected').val();
			ninka = true;
		}
		if($('#ninkaCloseTime option:selected').val() !== "") {
			conditions['ninkaCloseTime'] = $('#ninkaCloseTime option:selected').val();
			ninka = true;
		}
		if($('#ninkaIchijiHoiku').prop('checked')) {
			conditions['ninkaIchijiHoiku'] = 1;
			ninka = true;
		}
		if($('#ninkaYakan').prop('checked')) {
			conditions['ninkaYakan'] = 1;
			ninka = true;
		}
		if($('#ninkaKyujitu').prop('checked')) {
			conditions['ninkaKyujitu'] = 1;
			ninka = true;
		}
		if($('#ninkaVacancy').prop('checked')) {
			conditions['ninkaVacancy'] = 1;
			ninka = true;
		}

		// 認可外
		if($('#ninkagaiOpenTime option:selected').val() !== "") {
			conditions['ninkagaiOpenTime'] = $('#ninkagaiOpenTime option:selected').val();
			ninkagai = true;
		}
		if($('#ninkagaiCloseTime option:selected').val() !== "") {
			conditions['ninkagaiCloseTime'] = $('#ninkagaiCloseTime option:selected').val();
			ninkagai = true;
		}
		if($('#ninkagai24H').prop('checked')) {
			conditions['ninkagai24H'] = 1;
			ninkagai = true;
		}
		if($('#ninkagaiShomei').prop('checked')) {
			conditions['ninkagaiShomei'] = 1;
			ninkagai = true;
		}

		// 幼稚園

		// フィルター適用時
		if(Object.keys(conditions).length > 0) {
			filter = new FacilityFilter();
			newGeoJson = filter.getFilteredFeaturesGeoJson(conditions, nurseryFacilities);
			papamamap.addNurseryFacilitiesLayer(newGeoJson);
			$('#btnFilter').css('background-color', '#3388cc');
		} else {
			papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
			$('#btnFilter').css('background-color', '#f6f6f6');
			ninka = ninkagai = kindergarten = true;
		}

		// レイヤー表示状態によって施設の表示を切り替える
		updateLayerStatus({ninka: ninka, ninkagai: ninkagai, kindergarten: kindergarten});
	});

	// 絞込条件のリセット
	$('#filterReset').click(function(evt){
		// チェックボックスをリセット
		$(".filtercb").each(function(){
			$(this).prop('checked', false).checkboxradio('refresh');
		});
		// セレクトボックスをリセット
		$('.filtersb').each(function(){
			$(this).selectmenu(); // これを実行しないと次の行でエラー発生
			$(this).val('').selectmenu('refresh');
		});
		// 施設情報をリセット
		papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
		$('#btnFilter').css('background-color', '#f6f6f6');

		// レイヤー表示状態によって施設の表示を切り替える
		updateLayerStatus({ninka: true, ninkagai: true, kindergarten: true});
	});

	/**
	 * レイヤー状態を切り替える
	 *
	 * @param  {[type]} checkObj [description]
	 * @return {[type]}               [description]
	 */
	function updateLayerStatus(checkObj)
	{
		papamamap.switchLayer($('#cbNinka').prop('id'), checkObj.ninka);
		papamamap.switchLayer($('#cbNinkagai').prop('id'), checkObj.ninkagai);
		papamamap.switchLayer($('#cbKindergarten').prop('id'), checkObj.kindergarten);
		$('#cbNinka').prop('checked', checkObj.ninka).checkboxradio('refresh');
		$('#cbNinkagai').prop('checked', checkObj.ninkagai).checkboxradio('refresh');
		$('#cbKindergarten').prop('checked', checkObj.kindergarten).checkboxradio('refresh');
	}

	/**
	 * 円を描画する 関数内関数
	 *
	 * @param  {[type]} radius    [description]
	 * @return {[type]}           [description]
	 */
	function drawCenterCircle(radius)
	{
		if($('#cbDisplayCircle').prop('checked')) {
			papamamap.drawCenterCircle(radius);

			$('#center_markerTitle').hide();
			$('#center_marker').hide();

			var center = map.getView().getCenter();
			var coordinate = center;
			var marker = new ol.Overlay({
				position: coordinate,
				positioning: 'center-center',
				element: $('#center_marker'),
				stopEvent: false
			});
			map.addOverlay(marker);

			// 地図マーカーラベル設定
			$('#center_markerTitle').html("");
			var markerTitle = new ol.Overlay({
				position: coordinate,
				element: $('#center_markerTitle')
			});
			map.addOverlay(markerTitle);
			$('#center_markerTitle').show();
			$('#center_marker').show();
		}
	}

	/**
	 * 円を消す
	 *
	 * @return {[type]} [description]
	 */
	function clearCenterCircle()
	{
		papamamap.clearCenterCircle();
		$('#center_markerTitle').hide();
		$('#center_marker').hide();
		$('#changeCircleRadius').val('').selectmenu('refresh');
		return;
	}

	/**
	 * 指定座標にマーカーを設定する
	 * @param  {[type]} coordinate [description]
	 * @return {[type]}            [description]
	 */
	function drawMarker(coordinate, label)
	{
		$('#markerTitle').hide();
		$('#marker').hide();
		var marker = new ol.Overlay({
			position: coordinate,
			positioning: 'center-center',
			element: $('#marker'),
			stopEvent: false
		});
		map.addOverlay(marker);

		// 地図マーカーラベル設定
		$('#markerTitle').html(label);
		var markerTitle = new ol.Overlay({
			position: coordinate,
			element: $('#markerTitle')
		});
		map.addOverlay(markerTitle);
		$('#markerTitle').show();
		$('#marker').show();
		return;
	}

});
