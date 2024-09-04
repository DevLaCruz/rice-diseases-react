import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setError(null);
    };

    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Redimensiona la imagen a 224x224
                    canvas.width = 224;
                    canvas.height = 224;
                    ctx.drawImage(img, 0, 0, 224, 224);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, file.type);
                };

                img.onerror = () => {
                    reject(new Error('Error al redimensionar la imagen'));
                };
            };

            reader.onerror = () => {
                reject(new Error('Error al leer el archivo'));
            };
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        setError(null);

        try {
            const resizedImage = await resizeImage(selectedFile);

            const formData = new FormData();
            formData.append('image', resizedImage, selectedFile.name);

            const response = await axios.post('http://127.0.0.1:5000/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (err) {
            setError('Error al procesar la imagen. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="image-uploader">
            <h2>Sube una imagen o video de la planta de arroz</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
                {previewUrl && (
                    <div className="preview">
                        {selectedFile.type.startsWith('image/') ? (
                            <img src={previewUrl} alt="Vista previa" />
                        ) : (
                            <video src={previewUrl} controls muted />
                        )}
                    </div>
                )}
                <button type="submit" disabled={!selectedFile || loading}>
                    {loading ? 'Procesando...' : 'Subir y Clasificar'}
                </button>
            </form>
            {error && <div className="error">{error}</div>}
            {result && (
                <div className="result">
                    <h3>Resultado:</h3>
                    <p>Clase: {result.class}</p>
                    <p>Confianza: {result.confidence.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
