import { Box, Typography, Card, CardContent } from '@mui/material';
import { CardMembership } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';

const CertificateList = () => {
  return (
    <Box>
      <PageHeader title="My Certificates" subtitle="View your earned certificates" />
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <CardMembership sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No certificates earned yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Complete courses to earn certificates
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CertificateList;
