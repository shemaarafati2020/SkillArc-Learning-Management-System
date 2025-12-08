import { Box, Typography, Button, Breadcrumbs, Link, IconButton, Tooltip } from '@mui/material';
import { Add, NavigateNext, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actionText,
  actionIcon = <Add />,
  onAction,
  actionLink,
  showBackButton = false,
  children,
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (actionLink) {
      navigate(actionLink);
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          sx={{ mb: 1 }}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((crumb, index) => (
            crumb.link ? (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                href={crumb.link}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(crumb.link);
                }}
                sx={{ cursor: 'pointer' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {showBackButton && (
            <Tooltip title="Go Back">
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'action.hover' }}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
          )}
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {children}
          {actionText && (
            <Button
              variant="contained"
              startIcon={actionIcon}
              onClick={handleAction}
            >
              {actionText}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
