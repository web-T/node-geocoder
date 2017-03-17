'use strict';

var util = require('util');
var AbstractGeocoder = require('./abstractgeocoder');

/**
 * Constructor
 * @param <object> httpAdapter Http Adapter
 * @param <object> options     Options (language, clientId, apiKey, results, skip, sco, kind)
 */
var YandexGeocoder = function YandexGeocoder(httpAdapter, options) {
  YandexGeocoder.super_.call(this, httpAdapter, options);
};

util.inherits(YandexGeocoder, AbstractGeocoder);

function _findKey(result, wantedKey) {
  var val = null;
  Object.keys(result).every(function(key) {

  if (key === wantedKey) {
    val = result[key];
    return false;
  }

  if (typeof result[key] === 'object') {
    val = _findKey(result[key], wantedKey);

    return val === null ? true : false;
  }

  return true;
  });

  return val;
}

function _formatResult(result) {
  var position = result.GeoObject.Point.pos.split(' ');
  result = result.GeoObject.metaDataProperty.GeocoderMetaData.AddressDetails;

  return {
    'latitude' : position[0],
    'longitude' : position[1],
    'city' : _findKey(result, 'LocalityName'),
    'state' : _findKey(result, 'AdministrativeAreaName'),
    'streetName': _findKey(result, 'ThoroughfareName'),
    'streetNumber' : _findKey(result, 'PremiseNumber'),
    'countryCode' : _findKey(result, 'CountryNameCode'),
    'country' : _findKey(result, 'CountryName')
  };
}

// Yandex geocoding API endpoint
YandexGeocoder.prototype._endpoint = 'https://geocode-maps.yandex.ru/1.x/';

/**
* Geocode
* documentation page: https://tech.yandex.com/maps/doc/geocoder/desc/concepts/input_params-docpage/
* @param <string>   value    Value to geocode (Address)
* @param <function> callback Callback method
*/
YandexGeocoder.prototype._geocode = function(value, callback) {
  var params = {
    geocode : value,
    format: 'json'
  };

  if (this.options.language) {
    params.lang = this.options.language;
  }

  /**
   * results count (default 10)
   */
  if (typeof this.options.results && this.options.results) {
    params.results = this.options.results;
  }

  /**
   * skip count (default 0)
   */
  if (typeof this.options.skip && this.options.skip) {
    params.skip = this.options.skip;
  }

  /**
   * order coordinates are specified (default longlat), colud be `latlong`
   */
  if (typeof this.options.sco && this.options.sco) {
    params.sco = this.options.sco;
  }

  /**
   * Type of toponym (only for reverse geocoding)
   * could be `house`, `street`, `metro`, `district`, `locality`
   */
  if (typeof this.options.kind && this.options.kind) {
    params.kind = this.options.kind;
  }

  this.httpAdapter.get(this._endpoint, params, function(err, result) {
    if (err) {
      return callback(err);
    } else {
      var results = [];

      result.response.GeoObjectCollection.featureMember.forEach(function(geopoint) {
        results.push(_formatResult(geopoint));
      });

      results.raw = result;
      callback(false, results);
    }
  });
};

module.exports = YandexGeocoder;
