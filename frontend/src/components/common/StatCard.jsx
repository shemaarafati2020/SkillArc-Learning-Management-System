import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const AnimatedCounter = ({ value }) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && !Number.isNaN(Number(value))
      ? Number(value)
      : null;

  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    if (numericValue === null) return;
    const controls = animate(motionValue, numericValue, {
      duration: 0.8,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [numericValue, motionValue]);

  if (numericValue === null) {
    return <>{value}</>;
  }

  return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({ title, value, icon, color = 'primary', progress, onClick }) => {
  return (
    <Card
      component={motion.div}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick
          ? {
              boxShadow: 4,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              <AnimatedCounter value={value} />
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
              color={color}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
