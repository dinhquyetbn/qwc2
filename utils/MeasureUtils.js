/**
 * Copyright 2016 GeoSolutions Sas
 * Copyright 2016-2021 Sourcepole AG
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ol from 'openlayers';
import ConfigUtils from './ConfigUtils';
import CoordinatesUtils from "./CoordinatesUtils";
import LocaleUtils from './LocaleUtils';

const MeasureUtils = {
    getFormattedBearingValue(azimuth) {
        let bearing = "";
        if (azimuth >= 0 && azimuth < 90) {
            bearing = "N " + this.degToDms(azimuth) + " E";
        } else if (azimuth > 90 && azimuth <= 180) {
            bearing = "S " + this.degToDms(180.0 - azimuth) + " E";
        } else if (azimuth > 180 && azimuth < 270) {
            bearing = "S " + this.degToDms(azimuth - 180.0 ) + " W";
        } else if (azimuth >= 270 && azimuth <= 360) {
            bearing = "N " + this.degToDms(360 - azimuth ) + " W";
        }
        return bearing;
    },
    getFormattedCoordinate(coo, srcCrs = null, dstCrs = null, decimals = -1) {
        if (srcCrs && dstCrs && srcCrs !== dstCrs) {
            coo = CoordinatesUtils.reproject(coo, srcCrs, dstCrs);
        }
        if (decimals < 0) {
            // Automatically set decimals
            if (CoordinatesUtils.getUnits(dstCrs) === 'degrees') {
                decimals = 4;
            } else {
                decimals = 0;
            }
        }
        return coo.map(ord => LocaleUtils.toLocaleFixed(ord, decimals)).join(", ");
    },
    formatMeasurement(valueMetric, isArea, unit = 'metric', decimals = 2, withUnit = true) {
        let result = '';
        let unitlabel = unit;
        switch (unit) {
        case 'metric':
            if (isArea) {
                if (valueMetric > 1000000) {
                    result = LocaleUtils.toLocaleFixed(valueMetric / 1000000, decimals);
                    unitlabel = 'km²';
                } else if ( valueMetric > 10000) {
                    result = LocaleUtils.toLocaleFixed(valueMetric / 10000, decimals);
                    unitlabel = 'ha';
                } else {
                    result = LocaleUtils.toLocaleFixed(valueMetric, decimals);
                    unitlabel = 'm²';
                }
            } else {
                if (valueMetric > 1000) {
                    result = LocaleUtils.toLocaleFixed(valueMetric / 1000, decimals);
                    unitlabel = 'km';
                } else {
                    result = LocaleUtils.toLocaleFixed(valueMetric, decimals);
                    unitlabel = 'm';
                }
            }
            break;
        case 'm':
            result = LocaleUtils.toLocaleFixed(valueMetric, decimals); break;
        case 'ft':
            result = LocaleUtils.toLocaleFixed(valueMetric * 3.28084, decimals); break;
        case 'km':
            result = LocaleUtils.toLocaleFixed(valueMetric * 0.001, decimals); break;
        case 'mi':
            result = LocaleUtils.toLocaleFixed(valueMetric * 0.000621371, decimals); break;
        case 'sqm':
            result = LocaleUtils.toLocaleFixed(valueMetric, decimals); unitlabel = 'm²'; break;
        case 'sqft':
            result = LocaleUtils.toLocaleFixed(valueMetric * 10.7639, decimals); unitlabel = 'ft²'; break;
        case 'sqkm':
            result = LocaleUtils.toLocaleFixed(valueMetric * 0.000001, decimals); unitlabel = 'km²'; break;
        case 'sqmi':
            result = LocaleUtils.toLocaleFixed(valueMetric * 0.000000386102159, decimals); unitlabel = 'mi²'; break;
        case 'ha':
            result = LocaleUtils.toLocaleFixed(valueMetric * 0.0001, decimals); break;
        case 'acre':
            result = LocaleUtils.toLocaleFixed(valueMetric * 0.000247105381467, decimals); break;
        default:
            result = LocaleUtils.toLocaleFixed(valueMetric, decimals); break;
        }
        if (withUnit) {
            result += ' ' + unitlabel;
        }
        return result;
    },
    getFormattedLength(unit, length, decimals = 2, withUnit = true) {
        let result = '';
        switch (unit) {
        case 'm':
            result = LocaleUtils.toLocaleFixed(length, decimals); break;
        case 'ft':
            result = LocaleUtils.toLocaleFixed(length * 3.28084, decimals); break;
        case 'km':
            result = LocaleUtils.toLocaleFixed(length * 0.001, decimals); break;
        case 'mi':
            result = LocaleUtils.toLocaleFixed(length * 0.000621371, decimals); break;
        default:
            result = LocaleUtils.toLocaleFixed(length, decimals); break;
        }
        if (withUnit) {
            result += ' ' + unit;
        }
        return result;
    },
    getFormattedArea(unit, area, decimals = 2, withUnit = true) {
        let result = '';
        let unitlabel = unit;
        switch (unit) {
        case 'sqm':
            result = LocaleUtils.toLocaleFixed(area, decimals); unitlabel = 'm²'; break;
        case 'sqft':
            result = LocaleUtils.toLocaleFixed(area * 10.7639, decimals); unitlabel = 'ft²'; break;
        case 'sqkm':
            result = LocaleUtils.toLocaleFixed(area * 0.000001, decimals); unitlabel = 'km²'; break;
        case 'sqmi':
            result = LocaleUtils.toLocaleFixed(area * 0.000000386102159, decimals); unitlabel = 'mi²'; break;
        case 'ha':
            result = LocaleUtils.toLocaleFixed(area * 0.0001, decimals); break;
        case 'acre':
            result = LocaleUtils.toLocaleFixed(area * 0.000247105381467, decimals); break;
        default:
            result = LocaleUtils.toLocaleFixed(area, decimals); break;
        }
        if (withUnit) {
            result += ' ' + unitlabel;
        }
        return result;
    },
    degToDms(deg) {
        // convert decimal deg to minutes and seconds
        const d = Math.floor(deg);
        const minfloat = (deg - d) * 60;
        const m = Math.floor(minfloat);
        const secfloat = (minfloat - m) * 60;
        const s = Math.floor(secfloat);

        return ("" + d + "° " + m + "' " + s + "'' ");
    },
    updateFeatureMeasurements(feature, geomType, featureCrs, settings) {
        const geodesic = ConfigUtils.getConfigProp("geodesicMeasurements");
        const measurements = {};
        const geom = feature.getGeometry();
        if (geomType === 'Point') {
            feature.set('label', MeasureUtils.getFormattedCoordinate(geom.getCoordinates(), settings.mapCrs, settings.displayCrs));
        } else if (geomType === 'LineString') {
            const lengths = MeasureUtils.computeSegmentLengths(geom.getCoordinates(), featureCrs, geodesic);
            measurements.segment_lengths = lengths;
            measurements.length = lengths.reduce((sum, len) => sum + len, 0);
            feature.set('segment_labels', lengths.map(length => MeasureUtils.formatMeasurement(length, false, settings.lenUnit, settings.decimals)));
        } else if (["Ellipse", "Polygon", "Square", "Box"].includes(geomType)) {
            const area = MeasureUtils.computeArea(geom, featureCrs, geodesic);
            measurements.area = area;
            feature.set('label', MeasureUtils.formatMeasurement(area, true, settings.areaUnit, settings.decimals));
        } else if (geomType === 'Circle') {
            const radius = geom.getRadius();
            measurements.radius = radius;
            feature.set('label', "r = " + MeasureUtils.formatMeasurement(radius, false, settings.lenUnit, settings.decimals));
        } else if (geomType === 'Bearing') {
            const coo = geom.getCoordinates();
            measurements.bearing = CoordinatesUtils.calculateAzimuth(coo[0], coo[1], featureCrs);
            feature.set('label', MeasureUtils.getFormattedBearingValue(measurements.bearing));
        }
        feature.set('measurements', measurements);
    },
    computeSegmentLengths(coordinates, featureCrs, geodesic) {
        const lengths = [];
        const units = CoordinatesUtils.getUnits(featureCrs);
        if (geodesic || units === 'degrees') {
            const wgsCoo = coordinates.map(coo => CoordinatesUtils.reproject(coo, featureCrs, "EPSG:4326"));
            for (let i = 0; i < wgsCoo.length - 1; ++i) {
                lengths.push(ol.sphere.getDistance(wgsCoo[i], wgsCoo[i + 1]));
            }
        } else {
            const conv = units === 'feet' ? 0.3048 : 1;
            for (let i = 0; i < coordinates.length - 1; ++i) {
                const dx = coordinates[i + 1][0] - coordinates[i][0];
                const dy = coordinates[i + 1][1] - coordinates[i][1];
                lengths.push(Math.sqrt(dx * dx + dy * dy) * conv);
            }
        }
        return lengths;
    },
    computeArea(geometry, featureCrs, geodesic) {
        const units = CoordinatesUtils.getUnits(featureCrs);
        if (geodesic || units === 'degrees') {
            return ol.sphere.getArea(geometry, {projection: featureCrs});
        } else {
            const conv = units === 'feet' ? 0.3048 : 1;
            return geometry.getArea() * conv * conv;
        }
    }
};

export default MeasureUtils;
