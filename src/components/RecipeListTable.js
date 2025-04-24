import React, { useState } from 'react';
import { GridLegacy as Grid, Card, CardContent, CardActions, Typography, Button, Collapse, Box, Chip } from '@mui/material';

const RecipeListTable = ({ data = [], onEdit }) => {
  const [expanded, setExpanded] = useState(null);
  const handleExpand = id => setExpanded(prev => (prev === id ? null : id));

  return (
    <Grid container spacing={2}>
      {data.map(r => (
        <Grid item xs={12} sm={6} md={4} key={r.product_code}>
          <Card sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography variant="h6">{r.description || '-'}</Typography>
              <Typography variant="body2">Product Code: {r.product_code || '-'}</Typography>
              <Typography variant="body2">Cost per kg: {r.cost_excl_per_each_kg || '-'}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => onEdit(r)}>Edit</Button>
              <Button size="small" onClick={() => handleExpand(r.product_code)}>
                {expanded === r.product_code ? 'Hide Details' : 'Show Details'}
              </Button>
            </CardActions>
            <Collapse in={expanded === r.product_code} timeout="auto" unmountOnExit>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Ingredients</Typography>
                {r.ingredients && r.ingredients.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {r.ingredients.map((ing, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">{ing.description}</Typography>
                        <Box>
                          <Chip label={`${ing.recipe_use || '-'} ${ing.pack_size || ''}`} size="small" color="primary" />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">No ingredients available</Typography>
                )}
              </CardContent>
            </Collapse>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default RecipeListTable;
