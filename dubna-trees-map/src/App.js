import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import './App.css';

// Фикс стандартных иконок маркеров для React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Иконка для "больных/сухих" деревьев (красная)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function App() {
  const [trees, setTrees] = useState([]);
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterDrying, setFilterDrying] = useState(false);

  // Центр Дубны
  const dubnaCenter = [56.732, 37.166];

  // Загрузка данных с бэкенда
  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/trees')
      .then(response => {
        setTrees(response.data.features);
      })
      .catch(error => console.error("Ошибка загрузки данных:", error));
  }, []);

  // Логика фильтрации
  const filteredTrees = trees.filter(tree => {
    const props = tree.properties;
    const matchSpecies = filterSpecies === '' || props.species.toLowerCase().includes(filterSpecies.toLowerCase());
    const matchCondition = !filterDrying || props.is_drying === true;
    return matchSpecies && matchCondition;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* ПАНЕЛЬ ФИЛЬТРОВ (Виджет) */}
      <div style={{ padding: '15px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h2>🌳 Деревья Дубны</h2>
        <input 
          type="text" 
          placeholder="Фильтр по виду (например, Дуб)" 
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={filterDrying}
            onChange={(e) => setFilterDrying(e.target.checked)}
          />
          Показать только сухие/нуждающиеся в обрезке
        </label>
      </div>

      {/* КАРТА */}
      <MapContainer center={dubnaCenter} zoom={13} style={{ flexGrow: 1, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredTrees.map((tree) => {
          const { id, species, age, height, circumference, crown_diameter, notes, planting_date, is_drying, photo_url } = tree.properties;
          const [lng, lat] = tree.geometry.coordinates; // В GeoJSON [долгота, широта]
          
          return (
            <Marker 
              key={id} 
              position={[lat, lng]} 
              icon={is_drying ? redIcon : new L.Icon.Default()}
            >
              <Popup maxWidth={300}>
                <div style={{ fontFamily: 'sans-serif' }}>
                  {photo_url && (
                    <img src={photo_url} alt={species} style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />
                  )}
                  <h3 style={{ margin: '0 0 10px 0', color: is_drying ? '#e74c3c' : '#27ae60' }}>
                    #{id} - {species}
                  </h3>
                  <table style={{ width: '100%', textAlign: 'left', fontSize: '14px' }}>
                    <tbody>
                      <tr><th>Возраст:</th><td>{age ? `${age} лет` : 'Неизвестно'}</td></tr>
                      <tr><th>Высота:</th><td>{height ? `${height} м` : '-'}</td></tr>
                      <tr><th>Обхват:</th><td>{circumference ? `${circumference} см` : '-'}</td></tr>
                      <tr><th>Крона:</th><td>{crown_diameter ? `${crown_diameter} м` : '-'}</td></tr>
                      <tr><th>Посадка:</th><td>{planting_date || '-'}</td></tr>
                    </tbody>
                  </table>
                  {notes && (
                    <p style={{ fontSize: '13px', backgroundColor: '#f1f2f6', padding: '8px', borderRadius: '4px' }}>
                      <strong>📝 Примечание:</strong> {notes}
                    </p>
                  )}
                  {is_drying && (
                    <div style={{ marginTop: '10px', padding: '5px', backgroundColor: '#ffcccc', color: '#c0392b', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold' }}>
                      Требуется внимание эколога/обрезка!
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default App;