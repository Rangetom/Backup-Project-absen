"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import L from "leaflet";

const MapSearchControl = ({ setPosition }) => {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider({
            params: {
                countrycodes: 'id', // Batasi pencarian hanya di Indonesia
                'accept-language': 'id', // Utamakan bahasa Indonesia
                addressdetails: 1, // Sertakan detail alamat
            },
        });

        const searchControl = new GeoSearchControl({
            provider: provider,
            style: "bar",
            showMarker: false, // Kita pakai marker sendiri
            retainZoomLevel: false,
            animateZoom: true,
            autoClose: true,
            searchLabel: "Cari lokasi...",
        });

        map.addControl(searchControl);

        map.on("geosearch/showlocation", (result) => {
            const { x, y } = result.location;
            const latlng = { lat: y, lng: x };
            setPosition(latlng);
        });

        return () => {
            map.removeControl(searchControl);
        };
    }, [map, setPosition]);

    return null;
};

export default MapSearchControl;
