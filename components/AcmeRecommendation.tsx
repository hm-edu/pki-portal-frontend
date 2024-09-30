import { Alert, AlertTitle, Typography } from "@mui/material";

const AcmeRecommendation = () => {
    return <Alert severity="error" sx={{ mt: 1 }}>
        <AlertTitle>Warnung:</AlertTitle>
        <Typography>Es zeichnet sich eine weitere Verkürzung der Zertifikatslaufzeiten auf 90 Tage ab!
            Weiterführende Informationen zu den Plänen finden sich unter anderem bei <a href="https://www.heise.de/news/Google-moechte-Laufzeiten-fuer-TLS-Zertifikate-verkuerzen-8151372.html">heise.de</a> oder <a href="https://www.chromium.org/Home/chromium-security/root-ca-policy/moving-forward-together/">Google</a>. </Typography>
        <Typography><b>Aus diesem Grund wird der Einsatz von ACME bei allen Servern und Anwendungen dringend empfohlen.</b> </Typography>
        <Typography>Sollten Sie hierzu oder zu dem Einsatz von ACME Fragen haben, wenden Sie sich gerne an die Zentrale IT.</Typography>
    </Alert>;
};

export default AcmeRecommendation;
