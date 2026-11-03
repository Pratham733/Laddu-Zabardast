import { motion } from "framer-motion";
import { Truck, ShieldCheck, Leaf, Clock } from "lucide-react";
import { Box, Container, Grid, Paper, Typography, Avatar } from "@mui/material";

const badges = [
  {
    icon: <Leaf size={28} />,
    title: "100% Natural",
    description:
      "Pure homemade recipes with no preservatives or artificial flavors",
    color: "#16a34a",
    bgColor: "rgba(22, 163, 74, 0.1)",
  },
  {
    icon: <Truck size={28} />,
    title: "Fast Delivery",
    description:
      "Fresh products delivered to your doorstep within 2-3 business days",
    color: "#2563eb",
    bgColor: "rgba(37, 99, 235, 0.1)",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Quality Assured",
    description: "Every batch is tested for taste and quality before shipping",
    color: "#ea580c",
    bgColor: "rgba(234, 88, 12, 0.1)",
  },
  {
    icon: <Clock size={28} />,
    title: "Made to Order",
    description: "Freshly prepared when you order — never sitting on a shelf",
    color: "#9333ea",
    bgColor: "rgba(147, 51, 234, 0.1)",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function TrustBadges() {
  return (
    <Box component="section" sx={{ py: { xs: 5, md: 8 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Typography
          component={motion.h2}
          variant="h4"
          align="center"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.5rem", sm: "1.875rem", md: "2.25rem" },
            mb: { xs: 4, md: 6 },
            background: "linear-gradient(135deg, #ea580c, #d97706)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Why Choose Laddu Zabardast?
        </Typography>

        <Box
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Grid container spacing={{ xs: 2, sm: 3, md: 3 }}>
            {badges.map((badge) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={badge.title}>
                <Paper
                  component={motion.div}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  elevation={0}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    p: { xs: 3, md: 3.5 },
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition:
                      "box-shadow 0.25s ease, border-color 0.25s ease",
                    "&:hover": {
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: badge.bgColor,
                      color: badge.color,
                      mb: 2.5,
                    }}
                  >
                    {badge.icon}
                  </Avatar>

                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "text.primary",
                      mb: 1,
                    }}
                  >
                    {badge.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                    }}
                  >
                    {badge.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
