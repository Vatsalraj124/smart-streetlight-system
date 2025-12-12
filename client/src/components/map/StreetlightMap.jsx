import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/leaflet-fix.css';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Badge
} from '@mui/material';
import {
  WbIncandescent,
  LocationOn,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Layers,
  FilterList,
  GpsFixed
} from '@mui/icons-material';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon creator
const createCustomIcon = (status, condition) => {
  let color = '#666666';
  let iconChar = '💡';
  
  // Color based on status
  switch(status) {
    case 'pending':
      color = '#FF9800';
      iconChar = '🟠';
      break;
    case 'assigned':
      color = '#2196F3';
      iconChar = '🔵';
      break;
    case 'in_progress':
      color = '#9C27B0';
      iconChar = '🟣';
      break;
    case 'resolved':
      color = '#4CAF50';
      iconChar = '🟢';
      break;
    case 'closed':
      color = '#607D8B';
      iconChar = '⚫';
      break;
    default:
      color = '#666666';
  }
  
  // Override with condition if critical
  switch(condition) {
    case 'not_working':
      color = '#F44336';
      iconChar = '🔴';
      break;
    case 'flickering':
      color = '#FFC107';
      iconChar = '🟡';
      break;
    case 'broken_pole':
      color = '#795548';
      iconChar = '🟤';
      break;
  }

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-weight: bold;
    ">${iconChar}</div>`,
    iconSize: [30, 30],
    className: 'custom-marker'
  });
};

// Map controls component
const MapControls = ({ onZoomIn, onZoomOut, onLocate, onToggleLayer, userLocation }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Paper elevation={3} sx={{ p: 1, borderRadius: 2 }}>
        <Tooltip title="Zoom In">
          <IconButton onClick={onZoomIn} size="small">
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={onZoomOut} size="small">
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title={userLocation ? "Your Location" : "Locate Me"}>
          <IconButton onClick={onLocate} size="small" color={userLocation ? "primary" : "default"}>
            <Badge color="primary" variant="dot" invisible={!userLocation}>
              <MyLocation />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="Toggle Satellite View">
          <IconButton onClick={onToggleLayer} size="small">
            <Layers />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
};

// Legend component
const MapLegend = () => {
  const legendItems = [
    { color: '#F44336', label: 'Not Working', icon: '🔴', status: 'critical' },
    { color: '#FFC107', label: 'Flickering', icon: '🟡', status: 'warning' },
    { color: '#FF9800', label: 'Pending', icon: '🟠', status: 'pending' },
    { color: '#2196F3', label: 'Assigned', icon: '🔵', status: 'assigned' },
    { color: '#4CAF50', label: 'Resolved', icon: '🟢', status: 'resolved' },
    { color: '#795548', label: 'Broken Pole', icon: '🟤', status: 'damaged' }
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        p: 2,
        borderRadius: 2,
        maxWidth: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
      }}
    >
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <FilterList fontSize="small" sx={{ mr: 1 }} />
        Map Legend
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {legendItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="caption">{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// Main map component
const StreetlightMap = ({
  reports = [],
  center = [19.0760, 72.8777], // Default: Mumbai
  zoom = 12,
  height = '500px',
  showControls = true,
  onMarkerClick,
  selectedReport = null
}) => {
  const mapRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [userLocation, setUserLocation] = useState(null);
  const [mapType, setMapType] = useState('street');
  const [locationError, setLocationError] = useState('');

  // Handle zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = [latitude, longitude];
        setUserLocation(newLocation);
        if (mapRef.current) {
          mapRef.current.flyTo(newLocation, 15);
        }
      },
      (error) => {
        setLocationError(`Unable to get location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleToggleLayer = () => {
    setMapType(mapType === 'street' ? 'satellite' : 'street');
  };

  // Get tile URL based on map type
  const getTileUrl = () => {
    if (mapType === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png';
  };

  // Filter reports with valid coordinates
  const validReports = reports.filter(
    report => report.location && 
    report.location.coordinates && 
    report.location.coordinates.length === 2
  );

  // Calculate map bounds if we have reports
  const calculateBounds = () => {
    if (validReports.length === 0) return null;
    
    const lats = validReports.map(r => r.location.coordinates[1]);
    const lngs = validReports.map(r => r.location.coordinates[0]);
    
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  };

  const bounds = calculateBounds();

  return (
    <Box sx={{ position: 'relative', height, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map;
          map.on('zoom', () => {
            setCurrentZoom(map.getZoom());
          });
        }}
        bounds={bounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getTileUrl()}
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `<div style="
                background-color: #2196F3;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              ">
                <style>
                  @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
                  }
                </style>
              </div>`,
              iconSize: [20, 20]
            })}
          >
            <Popup>Your Current Location</Popup>
          </Marker>
        )}

        {/* Report markers */}
        {validReports.map((report, index) => {
          const [lng, lat] = report.location.coordinates; // GeoJSON: [lng, lat]
          const icon = createCustomIcon(report.status, report.lightCondition);
          const isSelected = selectedReport && selectedReport.id === report.id;

          return (
            <Marker
              key={report.id || `report-${index}`}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(report),
                mouseover: (e) => {
                  e.target.openPopup();
                },
                mouseout: (e) => {
                  e.target.closePopup();
                }
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 250, maxWidth: 300 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <WbIncandescent fontSize="small" sx={{ mr: 1 }} />
                    {report.title}
                  </Typography>
                  
                  <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      label={report.status}
                      size="small"
                      color={
                        report.status === 'resolved' ? 'success' :
                        report.status === 'pending' ? 'warning' :
                        report.status === 'assigned' ? 'info' : 'default'
                      }
                    />
                    <Chip
                      label={report.lightCondition?.replace('_', ' ') || 'Unknown'}
                      size="small"
                      variant="outlined"
                      color={
                        report.lightCondition === 'not_working' ? 'error' :
                        report.lightCondition === 'flickering' ? 'warning' : 'default'
                      }
                    />
                    {report.severity === 'critical' && (
                      <Chip
                        label="CRITICAL"
                        size="small"
                        color="error"
                        variant="filled"
                      />
                    )}
                  </Box>
                  
                  {report.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {report.description.length > 100 
                        ? `${report.description.substring(0, 100)}...` 
                        : report.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {report.location?.address || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '1px solid #eee' }}>
                    <Typography variant="caption" color="text.secondary">
                      Reported: {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {report.id?.substring(0, 8) || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Popup>
            </Marker>
          );
        })}

        {/* Selected report highlight circle */}
        {selectedReport && selectedReport.location?.coordinates && (
          <Circle
            center={[
              selectedReport.location.coordinates[1],
              selectedReport.location.coordinates[0]
            ]}
            radius={30}
            pathOptions={{ 
              color: '#FF5722', 
              fillColor: '#FF5722', 
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        )}
      </MapContainer>

      {showControls && (
        <>
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            onToggleLayer={handleToggleLayer}
            userLocation={userLocation}
          />
          <MapLegend />
        </>
      )}

      {/* Status bar */}
      <Paper
        elevation={2}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          px: 2,
          py: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Zoom: <strong>{currentZoom}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Reports: <strong>{validReports.length}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          View: <strong>{mapType === 'street' ? 'Street' : 'Satellite'}</strong>
        </Typography>
      </Paper>

      {/* Location error */}
      {locationError && (
        <Alert 
          severity="error" 
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            width: 'auto',
            maxWidth: '300px'
          }}
          onClose={() => setLocationError('')}
        >
          {locationError}
        </Alert>
      )}

      {validReports.length === 0 && (
        <Alert
          severity="info"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '80%',
            maxWidth: '400px'
          }}
        >
          <Typography variant="body2">
            No reports to display on the map. Try adjusting your filters or report a new issue.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default StreetlightMap;