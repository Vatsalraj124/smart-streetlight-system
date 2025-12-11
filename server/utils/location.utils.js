import geolib from 'geolib';

// Validate coordinates
const validateCoordinates = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { isValid: false, error: 'Coordinates must be numbers' };
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true };
};

// Calculate distance between two points in meters
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  return geolib.getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );
};

// Check if point is within radius
const isWithinRadius = (lat1, lng1, lat2, lng2, radiusMeters) => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusMeters;
};

// Format address from components
const formatAddress = (components = {}) => {
  const parts = [];
  
  if (components.street) parts.push(components.street);
  if (components.area) parts.push(components.area);
  if (components.city) parts.push(components.city);
  if (components.state) parts.push(components.state);
  if (components.pincode) parts.push(components.pincode);
  if (components.country) parts.push(components.country);
  
  return parts.join(', ');
};

// Get city boundaries (simplified - you can extend this)
const getCityBoundaries = (city) => {
  // Example boundaries for major cities
  const boundaries = {
    'mumbai': {
      minLat: 18.9,
      maxLat: 19.3,
      minLng: 72.7,
      maxLng: 73.0
    },
    'delhi': {
      minLat: 28.4,
      maxLat: 28.9,
      minLng: 76.8,
      maxLng: 77.3
    },
    'bangalore': {
      minLat: 12.8,
      maxLat: 13.2,
      minLng: 77.5,
      maxLng: 77.7
    }
    // Add more cities as needed
  };

  const cityKey = city.toLowerCase().trim();
  return boundaries[cityKey] || null;
};

// Check if location is within city
const isWithinCity = (lat, lng, city) => {
  const boundaries = getCityBoundaries(city);
  
  if (!boundaries) {
    console.warn(`No boundaries defined for city: ${city}`);
    return true; // Allow if city boundaries not defined
  }

  return (
    lat >= boundaries.minLat &&
    lat <= boundaries.maxLat &&
    lng >= boundaries.minLng &&
    lng <= boundaries.maxLng
  );
};

// Reverse geocode using Nominatim (OpenStreetMap)
const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartStreetlightSystem/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const address = data.address || {};
    
    return {
      formatted: data.display_name,
      components: {
        street: address.road || address.pedestrian || '',
        area: address.suburb || address.neighbourhood || '',
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        pincode: address.postcode || '',
        country: address.country || ''
      },
      raw: data
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// Get approximate address from coordinates (fallback)
const getApproximateAddress = (lat, lng) => {
  // Simple approximation based on coordinates
  // In production, use a proper geocoding service
  return {
    formatted: `Near coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    components: {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    }
  };
};

// Generate GeoJSON point
const generateGeoJSON = (lat, lng, address = null) => {
  return {
    type: 'Point',
    coordinates: [lng, lat], // GeoJSON uses [longitude, latitude]
    address: address?.formatted || null,
    city: address?.components?.city || null,
    pincode: address?.components?.pincode || null
  };
};

// Calculate bounding box for map view
const calculateBoundingBox = (lat, lng, radiusKm = 1) => {
  const earthRadius = 6371; // km
  const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos(lat * Math.PI / 180);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
};

export {
  validateCoordinates,
  calculateDistance,
  isWithinRadius,
  formatAddress,
  isWithinCity,
  reverseGeocode,
  getApproximateAddress,
  generateGeoJSON,
  calculateBoundingBox
};