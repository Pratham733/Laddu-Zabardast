import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Percent, ArrowRight } from "lucide-react";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Chip,
  Button,
  Avatar,
} from "@mui/material";

export function PromoBanner() {
  return (
    <Box component="section" sx={{ py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Paper
          component={motion.div}
          elevation={4}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            background:
              "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #f59e0b 100%)",
            color: "common.white",
            boxShadow: "0 8px 24px rgba(234, 88, 12, 0.25)",
          }}
        >
          {/* Decorative blur elements */}
          <Box
            sx={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              bgcolor: "rgba(255, 255, 255, 0.12)",
              filter: "blur(24px)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 130,
              height: 130,
              borderRadius: "50%",
              bgcolor: "rgba(255, 255, 255, 0.12)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />

          {/* Content */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              position: "relative",
              zIndex: 1,
              px: { xs: 3, sm: 4, md: 6 },
              py: { xs: 3.5, md: 4.5 },
            }}
          >
            <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
              <Box
                component={motion.div}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "rgba(255, 255, 255, 0.22)",
                    backdropFilter: "blur(6px)",
                    color: "common.white",
                  }}
                >
                  <Flame size={28} />
                </Avatar>
              </Box>

              <Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", mb: 0.5 }}
                >
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      color: "common.white",
                      fontSize: { xs: "1.3rem", sm: "1.6rem", md: "1.85rem" },
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Special Offer!
                  </Typography>

                  <Chip
                    icon={<Percent size={13} style={{ color: "#78350f" }} />}
                    label="HOT DEAL"
                    size="small"
                    component={motion.div}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    sx={{
                      bgcolor: "#facc15",
                      color: "#78350f",
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      height: 24,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.92)",
                    fontSize: { xs: "0.875rem", sm: "0.95rem" },
                    maxWidth: 520,
                    lineHeight: 1.5,
                  }}
                >
                  Get{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 800, color: "#fef08a" }}
                  >
                    20% OFF
                  </Box>{" "}
                  on your first order. Homemade goodness delivered fresh to your
                  doorstep!
                </Typography>
              </Box>
            </Stack>

            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
            >
              <Button
                component={Link}
                to="/shop"
                variant="contained"
                endIcon={<ArrowRight size={18} />}
                sx={{
                  bgcolor: "common.white",
                  color: "#ea580c",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  px: { xs: 4, md: 5 },
                  py: 1.25,
                  borderRadius: 9999,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  width: { xs: "100%", sm: "auto" },
                  "&:hover": {
                    bgcolor: "#fffbeb",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                  },
                }}
              >
                Shop Now
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
