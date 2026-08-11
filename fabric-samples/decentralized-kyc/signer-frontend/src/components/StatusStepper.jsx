import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

// Visualizes where a document sits in its lifecycle. Ties directly into the
// audit trail: each step corresponds to one or more AuditLog events.
// status: 'pending' | 'signed' | 'rejected'
export default function StatusStepper({ status }) {
  const rejected = status === 'rejected';
  const signed = status === 'signed';

  // Step 3's label/icon depends on how the document was resolved (or "TBD"
  // while still pending) — everything else about the stepper is static.
  const finalLabel = rejected ? 'Rejected' : 'Signed';
  const activeStep = rejected || signed ? 2 : 1;

  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ my: 1 }}>
      <Step completed>
        <StepLabel>Uploaded</StepLabel>
      </Step>
      <Step completed={activeStep >= 1}>
        <StepLabel error={false}>Pending Signature</StepLabel>
      </Step>
      <Step completed={signed} sx={rejected ? { '& .MuiStepIcon-root': { color: 'error.main' } } : undefined}>
        <StepLabel
          error={rejected}
          icon={
            activeStep === 2 ? (
              rejected ? (
                <CancelRoundedIcon color="error" />
              ) : (
                <CheckCircleRoundedIcon color="success" />
              )
            ) : undefined
          }
        >
          {activeStep === 2 ? finalLabel : 'Signed / Rejected'}
        </StepLabel>
      </Step>
    </Stepper>
  );
}
