import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { CertField } from "@/lib/types";

Font.register({
  family: "Inter",
  src: "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7W0Q5n-wU.woff2",
});

const BG_IMG_W = 800;
const BG_IMG_H = 566;
const PAGE_W = 841.89;
const PAGE_H = 595.28;

const hardcodedStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#fff" },
  border: { borderWidth: 3, borderColor: "#1a365d", padding: 30, flex: 1 },
  innerBorder: { borderWidth: 1, borderColor: "#cbd5e1", padding: 40, flex: 1, alignItems: "center", justifyContent: "center" },
  header: { fontSize: 36, fontWeight: "bold", color: "#1a365d", marginBottom: 8, letterSpacing: 4, textTransform: "uppercase" },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 30, letterSpacing: 2 },
  bodyText: { fontSize: 12, color: "#475569", marginBottom: 4 },
  studentName: { fontSize: 32, fontWeight: "bold", color: "#0f172a", marginVertical: 20, textAlign: "center" },
  courseTitle: { fontSize: 18, color: "#1a365d", fontWeight: "medium", marginBottom: 20, textAlign: "center" },
  details: { fontSize: 10, color: "#64748b", textAlign: "center" },
  footer: { marginTop: "auto", flexDirection: "row", justifyContent: "space-between", width: "100%", paddingTop: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  footerText: { fontSize: 10, color: "#64748b" },
  verificationCode: { fontSize: 8, color: "#94a3b8", marginTop: 4 },
  seal: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#1a365d", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  sealText: { color: "#fff", fontSize: 8, fontWeight: "bold", textAlign: "center" },
});

function getFieldValue(key: string, props: CertificateProps): string {
  switch (key) {
    case "studentName": return props.studentName;
    case "courseTitle": return props.courseTitle;
    case "instructorName": return props.instructorName ?? "";
    case "issueDate": return props.issueDate;
    case "certificateNumber": return props.certificateNumber;
    case "completionDate": return props.issueDate;
    case "verifyUrl": return props.verifyUrl ?? "";
    default: return "";
  }
}

function scaleX(x: number): number { return x * (PAGE_W / BG_IMG_W); }
function scaleY(y: number): number { return y * (PAGE_H / BG_IMG_H); }

interface CertificateProps {
  studentName: string;
  courseTitle: string;
  instructorName?: string | null;
  issueDate: string;
  certificateNumber: string;
  verifyUrl?: string;
  template?: { backgroundPath?: string | null; fields?: CertField[] | null } | null;
}

export function CertificateDocument(props: CertificateProps) {
  const { template } = props;
  const useTemplate = template?.backgroundPath && template?.fields && template.fields.length > 0;

  if (useTemplate) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={{ padding: 0, margin: 0 }}>
          <Image src={template.backgroundPath!} style={{ position: "absolute", top: 0, left: 0, width: PAGE_W, height: PAGE_H }} />
          {template.fields!.map((f, i) => {
            const value = getFieldValue(f.key, props);
            if (!value) return null;
            const isVerify = f.key === "verifyUrl";
            return (
              <Text
                key={i}
                style={{
                  position: "absolute",
                  left: scaleX(f.x),
                  top: scaleY(f.y),
                  fontSize: isVerify ? f.fontSize * 0.6 : f.fontSize,
                  color: f.color,
                  textAlign: f.align,
                  fontFamily: "Inter",
                  width: f.width ? scaleX(f.width) : undefined,
                }}
              >
                {value}
              </Text>
            );
          })}
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={hardcodedStyles.page}>
        <View style={hardcodedStyles.border}>
          <View style={hardcodedStyles.innerBorder}>
            <View style={hardcodedStyles.seal}>
              <Text style={hardcodedStyles.sealText}>CERTIFIED</Text>
            </View>
            <Text style={hardcodedStyles.header}>Certificate of Completion</Text>
            <Text style={hardcodedStyles.subtitle}>This certifies that</Text>
            <Text style={hardcodedStyles.studentName}>{props.studentName}</Text>
            <Text style={hardcodedStyles.bodyText}>has successfully completed the course</Text>
            <Text style={hardcodedStyles.courseTitle}>{props.courseTitle}</Text>
            {props.instructorName && <Text style={hardcodedStyles.details}>Under the instruction of {props.instructorName}</Text>}
            <Text style={[hardcodedStyles.details, { marginTop: 12 }]}>Issued on {props.issueDate}</Text>
            <View style={hardcodedStyles.footer}>
              <View>
                <Text style={hardcodedStyles.footerText}>Certificate #{props.certificateNumber}</Text>
                <Text style={hardcodedStyles.verificationCode}>Verify at: {props.verifyUrl || `salonweb.com/certificate/verify/${props.certificateNumber}`}</Text>
              </View>
              <Text style={hardcodedStyles.footerText}>Salon Hair Academy</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
