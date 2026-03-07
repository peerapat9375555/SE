import React, { useState, useEffect } from 'react';

// สูตรคำนวณระยะทาง Haversine (คืนค่าเป็นกิโลเมตร)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลก (กิโลเมตร)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function NearbyClinics({ isOpen, onClose }) {
  const [loadingStep, setLoadingStep] = useState(null); // 'gps', 'fetching', null
  const [clinics, setClinics] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    if (isOpen) {
      handleFindClinics();
    } else {
      // รีเซ็ตเมื่อปิดหน้าต่าง
      setClinics([]);
      setErrorMsg("");
      setLoadingStep(null);
      setUserLoc(null);
    }
  }, [isOpen]);

  const handleFindClinics = () => {
    setErrorMsg("");
    setLoadingStep('gps');
    
    if (!navigator.geolocation) {
      setErrorMsg("เบราว์เซอร์ของคุณไม่รองรับการค้นหาตำแหน่ง (GPS)");
      setLoadingStep(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLoc({ lat, lon });
        fetchClinicsFromOSM(lat, lon);
      },
      (error) => {
        console.error(error);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg("คุณไม่อนุญาตให้เข้าถึงตำแหน่งที่ตั้ง กรุณาเปิด GPS และอนุญาตการเข้าถึงครับ");
        } else {
          setErrorMsg("ไม่สามารถดึงข้อมูลตำแหน่งของคุณได้");
        }
        setLoadingStep(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchClinicsFromOSM = async (lat, lon) => {
    setLoadingStep('fetching');
    
    // ค้นหาในรัศมี 30km (30000 เมตร)
    const radius = 30000;
    
    // Overpass QL Query
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        relation["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="clinic"](around:${radius},${lat},${lon});
        way["amenity"="clinic"](around:${radius},${lat},${lon});
        relation["amenity"="clinic"](around:${radius},${lat},${lon});
        node["healthcare"="clinic"](around:${radius},${lat},${lon});
        way["healthcare"="clinic"](around:${radius},${lat},${lon});
        relation["healthcare"="clinic"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลจาก OpenStreetMap ได้');
      }

      const data = await response.json();
      
      const parsedClinics = data.elements.map(el => {
        const elLat = el.lat || (el.center && el.center.lat);
        const elLon = el.lon || (el.center && el.center.lon);
        
        let name = el.tags?.name || el.tags?.['name:en'] || 'สถานพยาบาล/คลินิก (ไม่ได้ระบุชื่อ)';
        let address = '';
        
        if (el.tags?.['addr:street']) address += el.tags['addr:street'] + ' ';
        if (el.tags?.['addr:city']) address += el.tags['addr:city'] + ' ';
        if (el.tags?.['addr:province']) address += el.tags['addr:province'];
        
        return {
          id: el.id,
          name,
          address: address.trim() || 'ไม่มีข้อมูลที่อยู่ระบุไว้',
          lat: elLat,
          lon: elLon,
          distance: calculateDistance(lat, lon, elLat, elLon)
        };
      });

      // กรองเอาเฉพาะอันที่มีชื่อขึ้นต้นด้วย "สถานพยาบาล" อาจจะเยอะไป ดึงมาให้หมดแล้วเรียงตามระยะทาง
      const sortedClinics = parsedClinics
        .filter(c => c.lat && c.lon) // ต้องมีพิกัด
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 30); // เอาแค่ 30 อันดับแรกที่ใกล้ที่สุด

      setClinics(sortedClinics);
      
    } catch (err) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์แผนที่ (อาจมีผู้ใช้งาน Overpass API จำนวนมาก)");
    } finally {
      setLoadingStep(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end md:items-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full md:w-[500px] max-h-[90vh] md:max-h-[80vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-[#117b6f] rounded-xl flex items-center justify-center text-xl">🏥</div>
            <div>
              <h2 className="font-black text-slate-800 text-lg">สถานพยาบาลใกล้ฉัน</h2>
              <p className="text-xs text-slate-500 font-medium">โรงพยาบาลและคลินิกรัศมี 30 กม.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-slate-50">
          
          {loadingStep === 'gps' && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
              <span className="text-4xl animate-bounce mb-4">📍</span>
              <p className="text-slate-700 font-bold mb-1">กำลังขอสิทธิ์เข้าถึงพิกัด GPS...</p>
              <p className="text-sm text-slate-500">กรุณากดอนุญาต (Allow) ที่เว็บบราวเซอร์ของคุณ</p>
            </div>
          )}

          {loadingStep === 'fetching' && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
              <span className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-[#117b6f] animate-spin mb-4"></span>
              <p className="text-slate-700 font-bold mb-1">กำลังค้นหาสถานพยาบาลใกล้เคียง</p>
              <p className="text-sm text-slate-500">ดึงข้อมูลจาก OpenStreetMap...</p>
            </div>
          )}

          {!loadingStep && errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="font-bold mb-3">{errorMsg}</p>
              <button 
                onClick={handleFindClinics}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm transition-colors"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}

          {!loadingStep && !errorMsg && clinics.length > 0 && (
            <div className="space-y-4">
              {clinics.map((clinic, index) => (
                <div key={clinic.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-base leading-tight">
                        {index + 1}. {clinic.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {clinic.address}
                      </p>
                    </div>
                    <div className="bg-teal-50 text-[#117b6f] px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap shrink-0">
                      {clinic.distance < 1 
                        ? `${(clinic.distance * 1000).toFixed(0)} ม.` 
                        : `${clinic.distance.toFixed(1)} กม.`}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lon}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      <span>🗺️</span> นำทาง (Google Maps)
                    </a>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4 pb-2">
                <p className="text-xs text-slate-400">ข้อมูลอ้างอิงจาก OpenStreetMap (OSM) <br/>อาจไม่ครบถ้วน 100%</p>
              </div>
            </div>
          )}

          {!loadingStep && !errorMsg && clinics.length === 0 && userLoc && (
            <div className="text-center py-10 opacity-70">
              <span className="text-4xl mb-3 block">🏜️</span>
              <p className="font-bold text-slate-700">ไม่พบสถานพยาบาลในรัศมี 30 กม.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
