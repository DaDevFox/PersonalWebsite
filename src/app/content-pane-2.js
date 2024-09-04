import boid_styles from "@/components/boids.module.css";

import SectionTitle from "@/components/general/SectionTitle";
import Row_ImageLeft from "../components/Row_ImageLeft";
import Row_ImageRight from "../components/Row_ImageRight";

import logo_gh from "@/media/GitHub_Invertocat_Dark.svg";
import logo_cs from "@/media/Csharp_Logo.png";
import logo_unity from "@/media/U_Logo_Black_RGB.png";
import logo_wpf from "@/media/wpf-logo.png";
import logo_excel from "@/media/excel-logo.png";
import logo_mongo from "@/media/mongo-green-logo.png";
import logo_react from "@/media/react-logo.png";
import RocketGame from "@/pages/games/rockets";

export default function ContentTwo(props) {
  return (
    <div className={boid_styles.boids_blocker}>
      <div className="content_container">
        <Row_ImageRight
          image_size={100}
          image_src={logo_excel}
          image_link="https://github.com/DaDevFox/Powertoys-Excel-Search"
          title="Powertoys Excel Search"
          description="Add-in to PowerToys Run utility which (fuzzy) searches Excel recent spreadsheets. "
          image_2
          image_2_width={50}
          image_2_height={50}
          image_2_src={logo_cs}
          image_3
          image_3_padding={10}
          image_3_width={50}
          image_3_height={50}
          image_3_src={logo_wpf}
        >
          <SectionTitle title="Projects" />
        </Row_ImageRight>
        <Row_ImageLeft
          image_size={100}
          image_src={logo_gh}
          image_link={"https://github.com/DaDevFox/testudo-tracker"}
          title="Testudo Tracker (WIP)"
          description="Web-based tracking client for UMD students to receive notifications on class seat availability and waitlist changes."
          image_2
          image_2_width={55}
          image_2_height={50}
          image_2_src={logo_react}
          image_3
          image_3_padding={10}
          image_3_width={150}
          image_3_height={50}
          image_3_src={logo_mongo}
        ></Row_ImageLeft>{" "}
      </div>
    </div>
  );
}
