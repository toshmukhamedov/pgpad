use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Release {
    pub id: usize,
    pub tag_name: String,
    pub assets: Vec<Asset>,
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Asset {
    pub url: Url,
    pub browser_download_url: Url,
    pub id: usize,
    pub name: String,
    pub size: i64,
}
pub fn get_latest_release(owner: &str, repo: &str) -> anyhow::Result<Release> {
    let url = format!("https://api.github.com/repos/{owner}/{repo}/releases/latest");

    let client = reqwest::blocking::Client::new();
    let release: Release = client
        .get(url)
        .header("User-Agent", "pgpad")
        .send()?
        .json()?;

    Ok(release)
}
