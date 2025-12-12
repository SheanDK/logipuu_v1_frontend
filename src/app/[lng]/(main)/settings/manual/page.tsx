// frontend/src/app/[lng]/(main)/settings/manual/page.tsx
'use client';

import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';

export default function UserManualPage() {
    const { t, i18n } = useTranslation(['common']);
    const manualFileName = i18n.language === 'fi' ? 'user_manual_fi.pdf' : 'user_manual_en.pdf';
    const pdfPath = `/manuals/${manualFileName}`;

    return (
        <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Paper 
                sx={{ 
                    p: 2, 
                    mb: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                }}
            >
                <Typography variant="h5" fontWeight="bold">
                    {i18n.language === 'fi' ? 'Käyttöohje' : 'User Manual'}
                </Typography>
                
                {/* Download Button */}
                <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />} 
                    component="a" 
                    href={pdfPath} 
                    download={manualFileName} 
                >
                    {i18n.language === 'fi' ? 'Lataa PDF' : 'Download PDF'}
                </Button>
            </Paper>

            {/* PDF Viewer (Iframe) */}
            <Paper sx={{ flexGrow: 1, overflow: 'hidden', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <object
                    data={pdfPath}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                >
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            {i18n.language === 'fi' 
                                ? 'Selaimesi ei tue PDF-tiedostojen näyttämistä.' 
                                : 'Your browser does not support displaying PDFs.'}
                        </Typography>
                        <Button variant="outlined" component="a" href={pdfPath} download>
                            {i18n.language === 'fi' ? 'Lataa opas' : 'Download Manual'}
                        </Button>
                    </Box>
                </object>
            </Paper>
        </Box>
    );
}