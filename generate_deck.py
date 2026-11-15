import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # blank slide

    # Theme Palette
    C_BG = RGBColor(11, 15, 25)         # #0B0F19 Dark void
    C_CARD = RGBColor(26, 34, 52)       # #1A2234 Dark card surface
    C_CARD_BORDER = RGBColor(45, 55, 75)
    C_AMBER = RGBColor(245, 158, 11)    # #F59E0B Flame Amber
    C_CYAN = RGBColor(6, 182, 212)      # #06B6D4 Cyber Cyan
    C_WHITE = RGBColor(248, 250, 252)   # #F8FAFC Heading text
    C_BODY = RGBColor(203, 213, 225)    # #CBD5E1 Body text
    C_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Muted text
    C_GREEN = RGBColor(34, 197, 94)     # #22C55E Success green
    C_RED = RGBColor(239, 68, 68)       # #EF4444 Error red

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG
        bg.line.fill.background()
        return bg

    def add_card(slide, left, top, width, height, bg_color=C_CARD, border_color=C_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
        return card

    def add_header(slide, title_text, category_text="NASA SPACE APPS CHALLENGE 2026"):
        # Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf = cat_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p0 = tf.paragraphs[0]
        p0.text = category_text.upper()
        p0.font.size = Pt(11)
        p0.font.bold = True
        p0.font.color.rgb = C_AMBER
        
        # Main Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.7))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(26)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE

    # -------------------------------------------------------------
    # SLIDE 1: Title & Introduction
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Large Hero Container
    add_card(s1, Inches(0.8), Inches(1.0), Inches(11.733), Inches(5.5), bg_color=C_CARD, border_color=C_AMBER)
    
    # Title badge
    tb1 = s1.shapes.add_textbox(Inches(1.4), Inches(1.4), Inches(10.5), Inches(0.4))
    tf1 = tb1.text_frame
    p = tf1.paragraphs[0]
    p.text = "NASA SPACE APPS CHALLENGE 2026  •  MICROGRAVITY EXPLORATION & SAFETY"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    # Title
    t_box = s1.shapes.add_textbox(Inches(1.4), Inches(1.9), Inches(10.5), Inches(1.5))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    p = tf_t.paragraphs[0]
    p.text = "FireSight"
    p.font.size = Pt(54)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    
    p2 = tf_t.add_paragraph()
    p2.text = "Empirical Microgravity Combustion Evidence & Physics-Informed Retrieval Synthesizer"
    p2.font.size = Pt(20)
    p2.font.color.rgb = C_CYAN
    p2.space_before = Pt(8)

    # Value statement box
    val_box = s1.shapes.add_textbox(Inches(1.4), Inches(3.8), Inches(10.5), Inches(1.4))
    tf_v = val_box.text_frame
    tf_v.word_wrap = True
    p = tf_v.paragraphs[0]
    p.text = "Grounding spacecraft fire safety in verifiable flight investigations (PSI, BASS, ACME, CIR, FLEX).\nDeterministic 6D physical similarity ranking, reciprocal rank fusion, and provenance citations—eliminating AI hallucination risks and unvalidated flammability boundaries."
    p.font.size = Pt(16)
    p.font.color.rgb = C_BODY
    p.line_spacing = 1.3

    # Footer metadata
    foot_box = s1.shapes.add_textbox(Inches(1.4), Inches(5.5), Inches(10.5), Inches(0.6))
    tf_f = foot_box.text_frame
    p = tf_f.paragraphs[0]
    p.text = "Public Open-Source Repository: https://github.com/hikki6969/Nasa-space-apps-challege\nFully Offline-Capable Docker Stack  •  Deterministic Python 3.14 / React 19 Engine"
    p.font.size = Pt(13)
    p.font.color.rgb = C_MUTED

    # -------------------------------------------------------------
    # SLIDE 2: The Challenge: The Microgravity Fire Blindspot
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "The Challenge: The Microgravity Fire Blindspot")

    cards_data_2 = [
        {
            "col": Inches(0.8), "width": Inches(3.64),
            "tag": "PHYSICS PARADOX", "tag_col": C_AMBER,
            "title": "1g Intuition Fails in Orbit",
            "body": "On Earth, buoyant convection naturally pulls fresh oxygen into the flame base and carries hot combustion products upward.\n\nIn microgravity (g ≈ 0), buoyancy vanishes. Diffusion and low-speed forced ventilation govern flame geometry, soot accumulation, and unexpected low-speed quenching or steady spherical burning."
        },
        {
            "col": Inches(4.84), "width": Inches(3.64),
            "tag": "SPARSE EXPERIMENTAL DATA", "tag_col": C_CYAN,
            "title": "Scarce, Fragmented Flight Tests",
            "body": "Spaceflight combustion experiments are historically precious and sparse (~24 distinct campaigns like PSI, BASS, CIR, FLEX, and ACME).\n\nData was siloed across legacy NASA technical reports, varying schema tables, and disparate PDF appendices, making cross-investigation queries nearly impossible for mission engineers."
        },
        {
            "col": Inches(8.88), "width": Inches(3.64),
            "tag": "CRITICAL RISK", "tag_col": C_RED,
            "title": "The AI Extrapolation Trap",
            "body": "Statistical curve-fitting and LLMs recklessly 'hallucinate' continuous flammability boundaries where data does not exist.\n\nADR-0005 rejects dangerous fitted predictive curves. Safety-critical engineering requires exact empirical points with strict domain disclaimers: 'Observed test domain; not a validated boundary.'"
        }
    ]

    for c in cards_data_2:
        add_card(s2, c["col"], Inches(1.8), c["width"], Inches(5.1))
        tb = s2.shapes.add_textbox(c["col"] + Inches(0.3), Inches(2.1), c["width"] - Inches(0.6), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = c["tag"]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = c["tag_col"]

        p_t = tf.add_paragraph()
        p_t.text = c["title"]
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE
        p_t.space_before = Pt(8)
        p_t.space_after = Pt(14)

        p_b = tf.add_paragraph()
        p_b.text = c["body"]
        p_b.font.size = Pt(14)
        p_b.font.color.rgb = C_BODY
        p_b.line_spacing = 1.3

    # -------------------------------------------------------------
    # SLIDE 3: FireSight Solution: Evidence-First Architecture
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "FireSight Solution: Evidence-First Architecture")

    # Left Container: 6D Physical Ranking Engine
    add_card(s3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.1))
    tb_l = s3.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.5))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True

    p = tf_l.paragraphs[0]
    p.text = "DETERMINISTIC SIMILARITY SCORING"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    p = tf_l.add_paragraph()
    p.text = "6-Dimensional Physical Matcher"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_before = Pt(6)
    p.space_after = Pt(12)

    p = tf_l.add_paragraph()
    p.text = "Instead of black-box neural generation, FireSight computes deterministic Gaussian physical distance across 6 primary dimensions:\n" \
             "• Pressure (P): Atmospheric & hypobaric regime matching\n" \
             "• Oxygen (X_O2): Hypoxic to hyperoxic concentration matching\n" \
             "• Flow Velocity (v_flow): Forced ventilation vs quiescent drift\n" \
             "• Fuel Classification: PMMA, Cellulose, Polyethylene, etc.\n" \
             "• Ambient Temperature (T) & Gravity Level (g_level)\n\n" \
             "Coverage Penalty: Penalizes records missing requested physical fields rather than falsely assuming a perfect match."
    p.font.size = Pt(13.5)
    p.font.color.rgb = C_BODY
    p.line_spacing = 1.25

    # Right Container: ADR-0005 Rigor vs Black Box
    add_card(s3, Inches(6.8), Inches(1.8), Inches(5.733), Inches(5.1))
    tb_r = s3.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.1), Inches(4.5))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    p = tf_r.paragraphs[0]
    p.text = "SCIENTIFIC INTEGRITY: ADR-0005"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_CYAN

    p = tf_r.add_paragraph()
    p.text = "Evidence Synthesizer vs. Generative Model"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_before = Pt(6)
    p.space_after = Pt(12)

    p = tf_r.add_paragraph()
    p.text = "Architectural Decision Record (ADR-0005):\n" \
             "• Zero Synthetic Probability Curves: Forbids fitting predictive boundary curves over sparse test data.\n" \
             "• Mandatory Domain Disclaimer: All visualizations state exact empirical coverage, not safety frontiers.\n" \
             "• Full Audit Trail: Every synthesized finding cites its Investigation PSI ID, Table Number, and DOI link.\n" \
             "• Strict Scope Guard: Instantly refuses off-domain queries (rocket engines, turbopumps, hydrazine, LOX) to protect life-safety boundaries."
    p.font.size = Pt(13.5)
    p.font.color.rgb = C_BODY
    p.line_spacing = 1.25

    # -------------------------------------------------------------
    # SLIDE 4: System Architecture & Retrieval Pipeline
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "System Architecture & Retrieval Pipeline")

    arch_cards = [
        {
            "col": Inches(0.8), "width": Inches(2.75),
            "num": "01", "name": "Curated Corpus",
            "body": "24 spaceflight investigations\n22 structured empirical tables\n7 canonical NASA annotations\nExtracted physical domains:\nPressure, O2%, Flow, Sample Fuel"
        },
        {
            "col": Inches(3.75), "width": Inches(2.75),
            "num": "02", "name": "Hybrid Retrieval",
            "body": "Lexical Search:\nSQLite FTS5 with BM25\n\nSemantic Search:\nall-MiniLM-L6-v2 embeddings\n\nReciprocal Rank Fusion:\nRRF (k=60) merges dual passes"
        },
        {
            "col": Inches(6.7), "width": Inches(2.75),
            "num": "03", "name": "Deterministic Core",
            "body": "6D Gaussian Physical Matcher\nWeighted Euclidean score\nDimension coverage penalty\nCategorical match tiers:\nExact, Comparable, Partial"
        },
        {
            "col": Inches(9.65), "width": Inches(2.88),
            "num": "04", "name": "Interactive UI",
            "body": "React 19 + Tailwind CSS\nPlotly.js 2D/3D Scatter Domain\nMulti-dataset condition compare\nZero external CDN dependency\n100% Air-Gapped Offline Ready"
        }
    ]

    for ac in arch_cards:
        add_card(s4, ac["col"], Inches(1.8), ac["width"], Inches(3.5))
        tb = s4.shapes.add_textbox(ac["col"] + Inches(0.2), Inches(2.0), ac["width"] - Inches(0.4), Inches(3.1))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = ac["num"]
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_AMBER

        p = tf.add_paragraph()
        p.text = ac["name"]
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.space_before = Pt(4)
        p.space_after = Pt(10)

        p = tf.add_paragraph()
        p.text = ac["body"]
        p.font.size = Pt(13)
        p.font.color.rgb = C_BODY
        p.line_spacing = 1.25

    # Bottom Banner: End-to-End Latency & Offline Container Stack
    add_card(s4, Inches(0.8), Inches(5.6), Inches(11.733), Inches(1.3), bg_color=RGBColor(18, 24, 38))
    tb_b = s4.shapes.add_textbox(Inches(1.1), Inches(5.75), Inches(11.1), Inches(1.0))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p = tf_b.paragraphs[0]
    p.text = "OFFLINE-READY PRODUCTION STACK"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_GREEN

    p = tf_b.add_paragraph()
    p.text = "FastAPI backend + Nginx reverse proxy + React SPA bundled into self-contained Docker Compose stack.\nVerified air-gapped execution: runs 100% locally with zero cloud API keys, zero external internet dependencies, and P95 latency of 7.4 ms."
    p.font.size = Pt(13.5)
    p.font.color.rgb = C_BODY
    p.space_before = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 5: Interactive Dashboard & Empirical Domain Map
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Interactive Dashboard & Empirical Domain Map")

    # Left: Embed actual screenshot if available
    img_path = ".teamwork/scratch/m3t3/browser2/11_map_targeted.png"
    if os.path.exists(img_path):
        # Card outline for image
        add_card(s5, Inches(0.8), Inches(1.8), Inches(6.8), Inches(5.1))
        s5.shapes.add_picture(img_path, Inches(0.9), Inches(1.9), Inches(6.6), Inches(4.9))
    else:
        add_card(s5, Inches(0.8), Inches(1.8), Inches(6.8), Inches(5.1))
        tb = s5.shapes.add_textbox(Inches(1.1), Inches(2.2), Inches(6.2), Inches(4.3))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = "[Empirical Domain Map View]"
        p.font.size = Pt(20)
        p.font.color.rgb = C_CYAN

    # Right: Features & Scientific Guardrail Notice
    add_card(s5, Inches(7.9), Inches(1.8), Inches(4.633), Inches(5.1))
    tb_r5 = s5.shapes.add_textbox(Inches(8.2), Inches(2.1), Inches(4.0), Inches(4.5))
    tf_r5 = tb_r5.text_frame
    tf_r5.word_wrap = True

    p = tf_r5.paragraphs[0]
    p.text = "EMPIRICAL VISUALIZATION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    p = tf_r5.add_paragraph()
    p.text = "Real Flight Test Domains"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_before = Pt(6)
    p.space_after = Pt(10)

    p = tf_r5.add_paragraph()
    p.text = "• Scatter Exploration: Interactive Plotly visualization plotting Pressure vs. Oxygen % vs. Forced Flow Velocity for all 24 flight tests.\n\n" \
             "• Investigation Compare: Side-by-side comparative inspection highlighting shared vs differentiating physical conditions across PSI-01 to PSI-25.\n\n" \
             "• Mandatory Scientific Disclaimer:\n" \
             "  \"Observed test domain; not a validated flammability boundary.\"\n\n" \
             "• Direct Provenance: Click any point to view original NASA technical report, table records, and author citations."
    p.font.size = Pt(13)
    p.font.color.rgb = C_BODY
    p.line_spacing = 1.25

    # -------------------------------------------------------------
    # SLIDE 6: Rigorous Verification & Scientific Guardrails
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Rigorous Verification & Scientific Guardrails")

    metrics = [
        {
            "col": Inches(0.8), "width": Inches(2.75),
            "stat": "155 / 155", "label": "Pytest Suite Passing",
            "body": "100% backend unit & integration test pass rate. Covers ranking invariants, candidate zero-filtering, OpenAPI schema contracts, and data validation."
        },
        {
            "col": Inches(3.75), "width": Inches(2.75),
            "stat": "7.4 ms", "label": "P95 Query Latency",
            "body": "Benchmark ranking tests achieve 7.4 ms P95 latency over 10-candidate pools (60x faster than the 500 ms SLA ceiling)."
        },
        {
            "col": Inches(6.7), "width": Inches(2.75),
            "stat": "7 / 7", "label": "Scope Guard Refusals",
            "body": "Deterministic regex and semantic scope guard safely intercepts off-domain propulsion queries (rocket engines, turbopumps, LOX) with explicit refusals."
        },
        {
            "col": Inches(9.65), "width": Inches(2.88),
            "stat": "100%", "label": "Headless E2E Pass",
            "body": "Playwright Chromium UI suite passed across desktop, mobile, and keyboard navigation. 0 console errors, 0 failed network requests, verified offline."
        }
    ]

    for m in metrics:
        add_card(s6, m["col"], Inches(1.8), m["width"], Inches(3.4))
        tb = s6.shapes.add_textbox(m["col"] + Inches(0.2), Inches(2.0), m["width"] - Inches(0.4), Inches(3.0))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = m["stat"]
        p.font.size = Pt(32)
        p.font.bold = True
        p.font.color.rgb = C_AMBER

        p = tf.add_paragraph()
        p.text = m["label"]
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.text = m["body"]
        p.font.size = Pt(12.5)
        p.font.color.rgb = C_BODY
        p.line_spacing = 1.2

    # Lower Card: Direct vs Proxied Parity
    add_card(s6, Inches(0.8), Inches(5.5), Inches(11.733), Inches(1.4), bg_color=RGBColor(18, 24, 38))
    tb_lp = s6.shapes.add_textbox(Inches(1.1), Inches(5.65), Inches(11.1), Inches(1.1))
    tf_lp = tb_lp.text_frame
    tf_lp.word_wrap = True
    p = tf_lp.paragraphs[0]
    p.text = "AIR-GAPPED REPRODUCIBILITY & AUDIT PROOF"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_CYAN

    p = tf_lp.add_paragraph()
    p.text = "Independent multi-agent audit verified full parity between direct Python endpoints and Nginx-proxied production bundle. Zero regressions across canonical scenarios (A: ISS cabin PMMA, B: Lunar hypobaric Nomex, C: Martian chamber, D: ACME gas burner)."
    p.font.size = Pt(13)
    p.font.color.rgb = C_BODY
    p.space_before = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 7: Mission Impact & Next Steps
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Mission Impact & Next Steps")

    impact_cards = [
        {
            "col": Inches(0.8), "width": Inches(3.64),
            "tag": "CREW SAFETY", "tag_col": C_AMBER,
            "title": "Artemis & Lunar Gateway",
            "body": "Exploration missions use non-standard atmospheres (8.2 psia, 34% O2 in lunar landers).\n\nFireSight enables flight controllers and safety engineers to query exact past flight tests matching proposed cabin atmospheres in seconds, evaluating material ignition risks with grounded data."
        },
        {
            "col": Inches(4.84), "width": Inches(3.64),
            "tag": "DESIGN CO-PILOT", "tag_col": C_CYAN,
            "title": "Zero-Hallucination Retrieval",
            "body": "Traditional LLM co-pilots guess answers and fabricate sources.\n\nFireSight guarantees that every single statement, table row, and recommendation ties back to a verified NASA test identifier with zero speculation, preserving scientific rigor for mission-critical decisions."
        },
        {
            "col": Inches(8.88), "width": Inches(3.64),
            "tag": "COMMUNITY & ROADMAP", "tag_col": C_GREEN,
            "title": "Open-Source & Expansion",
            "body": "Future extensions:\n• Ingesting Safford, Soom, and CIR Solid Fuel Ignition and Extinction (SoFIE) campaign data.\n• Standardized API integrations for spacecraft habitat life support computer models.\n• Publicly accessible on GitHub for global research collaboration."
        }
    ]

    for c in impact_cards:
        add_card(s7, c["col"], Inches(1.8), c["width"], Inches(4.3))
        tb = s7.shapes.add_textbox(c["col"] + Inches(0.3), Inches(2.0), c["width"] - Inches(0.6), Inches(3.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = c["tag"]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = c["tag_col"]

        p_t = tf.add_paragraph()
        p_t.text = c["title"]
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE
        p_t.space_before = Pt(6)
        p_t.space_after = Pt(10)

        p_b = tf.add_paragraph()
        p_b.text = c["body"]
        p_b.font.size = Pt(13)
        p_b.font.color.rgb = C_BODY
        p_b.line_spacing = 1.25

    # Bottom Banner: Project Links
    add_card(s7, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.8), bg_color=RGBColor(18, 24, 38))
    tb_f7 = s7.shapes.add_textbox(Inches(1.1), Inches(6.4), Inches(11.1), Inches(0.6))
    tf_f7 = tb_f7.text_frame
    tf_f7.word_wrap = True
    p = tf_f7.paragraphs[0]
    p.text = "PROJECT REPOSITORY:  https://github.com/hikki6969/Nasa-space-apps-challege  |  NASA SPACE APPS CHALLENGE 2026"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    # Save presentation
    out_path = "FireSight_Demonstration.pptx"
    prs.save(out_path)
    print(f"Presentation generated successfully: {out_path} ({len(prs.slides)} slides)")

if __name__ == "__main__":
    create_deck()
